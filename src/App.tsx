import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { formatDateKey, minutesToSeconds } from "./lib/time";
import { isTauri } from "./lib/tauri";
import { loadState, saveState } from "./lib/store";
import { TimerCircle, TimerControls, PhaseSelector } from "./components/timer";
import { TaskList } from "./components/tasks/TaskList";
import { TaskForm } from "./components/tasks/TaskForm";
import type { TaskFilterType } from "./components/tasks/TaskFilter";
import { CurrentTaskDisplay, TodayStats } from "./components/stats";
import { TimerSettings, PreferenceSettings, OtherSettings } from "./components/settings";
import type {
  AppStateSnapshot,
  DailyStat,
  NoiseType,
  Phase,
  Settings,
  StatsHistory,
  Task,
  TimerStatus,
} from "./types";

const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartNext: false,
  soundEnabled: true,
  whiteNoiseEnabled: false,
  whiteNoiseType: "rain",
  miniMode: false,
  minimizeToTray: true,
};

const PHASE_LABEL: Record<Phase, string> = {
  work: "专注",
  shortBreak: "短休息",
  longBreak: "长休息",
};

const PHASE_DESCRIPTION: Record<Phase, string> = {
  work: "保持专注，完成当前任务",
  shortBreak: "放松一下，准备下一轮",
  longBreak: "深度休息，恢复精力",
};

const phaseMinutes = (phase: Phase, settings: Settings) => {
  switch (phase) {
    case "work":
      return settings.workMinutes;
    case "shortBreak":
      return settings.shortBreakMinutes;
    case "longBreak":
      return settings.longBreakMinutes;
    default:
      return settings.workMinutes;
  }
};

const getDefaultDailyStat = (dateKey: string): DailyStat => ({
  date: dateKey,
  focusMinutes: 0,
  sessions: 0,
});

const getNextPhase = (
  phase: Phase,
  workSessionsSinceLongBreak: number,
  settings: Settings,
  completedWorkSession: boolean,
) => {
  if (phase === "work") {
    const updatedSessions = completedWorkSession
      ? workSessionsSinceLongBreak + 1
      : workSessionsSinceLongBreak;
    if (completedWorkSession && updatedSessions >= settings.longBreakEvery) {
      return { nextPhase: "longBreak" as Phase, nextWorkSessions: 0 };
    }
    return { nextPhase: "shortBreak" as Phase, nextWorkSessions: updatedSessions };
  }
  return { nextPhase: "work" as Phase, nextWorkSessions: workSessionsSinceLongBreak };
};

const getPhaseIcon = (phase: Phase) => {
  if (phase === "work") return "⏱";
  if (phase === "shortBreak") return "☕";
  return "🌿";
};

type ViewMode = "main" | "settings";

const useNotification = () => {
  return async (title: string, body: string) => {
    if (!isTauri()) return;
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    if (granted) {
      sendNotification({ title, body });
    }
  };
};

const useWhiteNoise = () => {
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  const ensureContext = () => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  };

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (filterRef.current) {
      filterRef.current.disconnect();
      filterRef.current = null;
    }
  }, []);

  const start = useCallback(
    (type: NoiseType) => {
      const context = ensureContext();
      stop();

      const bufferSize = context.sampleRate * 2;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.35;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = type === "cafe" ? 2600 : type === "fire" ? 1200 : 1800;

      source.connect(filter);
      filter.connect(context.destination);

      sourceRef.current = source;
      filterRef.current = filter;
      source.start(0);
    },
    [stop],
  );

  return { start, stop };
};

const useChime = () => {
  const contextRef = useRef<AudioContext | null>(null);

  return useCallback((enabled: boolean) => {
    if (!enabled) return;
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    const context = contextRef.current;
    const now = context.currentTime;
    const frequencies = [523.25, 659.25, 783.99];

    frequencies.forEach((frequency, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.value = frequency;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, now + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.35);
    });
  }, []);
};

const clampMinutes = (value: number) => {
  if (Number.isNaN(value)) return 1;
  return Math.min(120, Math.max(1, Math.round(value)));
};

const App = () => {
  const notify = useNotification();
  const playChime = useChime();
  const { start: startNoise, stop: stopNoise } = useWhiteNoise();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<StatsHistory>({});
  const [phase, setPhase] = useState<Phase>("work");
  const [remainingSeconds, setRemainingSeconds] = useState(
    minutesToSeconds(DEFAULT_SETTINGS.workMinutes),
  );
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [workSessionsSinceLongBreak, setWorkSessionsSinceLongBreak] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>("active");
  const [settingsTab, setSettingsTab] = useState<"timer" | "preference" | "other">("timer");

  const totalSeconds = useMemo(
    () => minutesToSeconds(phaseMinutes(phase, settings)),
    [phase, settings],
  );

  const todayKey = formatDateKey(new Date());
  const todayStats = history[todayKey] ?? getDefaultDailyStat(todayKey);

  const currentTask = useMemo(
    () => tasks.find((task) => task.id === currentTaskId) ?? null,
    [tasks, currentTaskId],
  );

  const setPhaseAndReset = useCallback(
    (nextPhase: Phase) => {
      setPhase(nextPhase);
      setRemainingSeconds(minutesToSeconds(phaseMinutes(nextPhase, settings)));
      setStatus("idle");
    },
    [settings],
  );

  const handlePhaseComplete = useCallback(() => {
    const completedWorkSession = phase === "work";

    if (completedWorkSession) {
      setHistory((prev) => {
        const key = formatDateKey(new Date());
        const current = prev[key] ?? getDefaultDailyStat(key);
        return {
          ...prev,
          [key]: {
            ...current,
            focusMinutes: current.focusMinutes + settings.workMinutes,
            sessions: current.sessions + 1,
          },
        };
      });

      if (currentTaskId) {
        setTasks((prev) => {
          let shouldClearCurrent = false;
          const nextTasks = prev.map((task) => {
            if (task.id !== currentTaskId) return task;
            const completedPomodoros = Math.min(
              task.completedPomodoros + 1,
              task.estPomodoros,
            );
            const completed = completedPomodoros >= task.estPomodoros;
            if (completed) {
              shouldClearCurrent = true;
            }
            return {
              ...task,
              completedPomodoros,
              completed,
            };
          });
          if (shouldClearCurrent) {
            setCurrentTaskId(null);
          }
          return nextTasks;
        });
      }
    }

    const { nextPhase, nextWorkSessions } = getNextPhase(
      phase,
      workSessionsSinceLongBreak,
      settings,
      completedWorkSession,
    );

    setPhase(nextPhase);
    setWorkSessionsSinceLongBreak(nextWorkSessions);
    setRemainingSeconds(minutesToSeconds(phaseMinutes(nextPhase, settings)));
    setStatus(settings.autoStartNext ? "running" : "idle");

    const title = "阶段切换";
    const body = settings.autoStartNext
      ? `${PHASE_LABEL[phase]}结束，${PHASE_LABEL[nextPhase]}已开始。`
      : `${PHASE_LABEL[phase]}结束，准备进入${PHASE_LABEL[nextPhase]}。`;
    void notify(title, body);
    playChime(settings.soundEnabled);
  }, [
    currentTaskId,
    notify,
    phase,
    playChime,
    settings,
    workSessionsSinceLongBreak,
  ]);

  const handleStart = useCallback(() => {
    setStatus("running");
  }, []);

  const handlePause = useCallback(() => {
    setStatus("paused");
  }, []);

  const handleReset = useCallback(() => {
    setRemainingSeconds(minutesToSeconds(phaseMinutes(phase, settings)));
    setStatus("idle");
  }, [phase, settings]);

  const handleSkip = useCallback(() => {
    const { nextPhase, nextWorkSessions } = getNextPhase(
      phase,
      workSessionsSinceLongBreak,
      settings,
      false,
    );
    setPhase(nextPhase);
    setWorkSessionsSinceLongBreak(nextWorkSessions);
    setRemainingSeconds(minutesToSeconds(phaseMinutes(nextPhase, settings)));
    setStatus(settings.autoStartNext ? "running" : "idle");
  }, [phase, settings, workSessionsSinceLongBreak]);

  const handleOpenTaskForm = useCallback(() => {
    setEditingTaskId(null);
    setTaskFormOpen(true);
  }, []);

  const handleEditTask = useCallback(
    (taskId: string) => {
      setEditingTaskId(taskId);
      setTaskFormOpen(true);
    },
    [],
  );

  const handleSaveTask = useCallback(
    (title: string, estPomodoros: number) => {
      if (editingTaskId) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === editingTaskId ? { ...task, title, estPomodoros } : task,
          ),
        );
      } else {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title,
          estPomodoros,
          completedPomodoros: 0,
          completed: false,
          createdAt: Date.now(),
        };
        setTasks((prev) => [...prev, newTask]);
      }
      setTaskFormOpen(false);
      setEditingTaskId(null);
    },
    [editingTaskId],
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      if (currentTaskId === taskId) {
        setCurrentTaskId(null);
      }
    },
    [currentTaskId],
  );

  const handleSelectTask = useCallback((taskId: string) => {
    setCurrentTaskId(taskId);
  }, []);

  const handleToggleTaskComplete = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
      );
    },
    [],
  );

  const handleClearCurrentTask = useCallback(() => {
    setCurrentTaskId(null);
  }, []);

  const updateMinutes = useCallback(
    (key: "workMinutes" | "shortBreakMinutes" | "longBreakMinutes", value: number) => {
      const nextValue = clampMinutes(value);
      setSettings((prev) => ({ ...prev, [key]: nextValue }));
      if (status !== "running") {
        const matchPhase =
          (key === "workMinutes" && phase === "work") ||
          (key === "shortBreakMinutes" && phase === "shortBreak") ||
          (key === "longBreakMinutes" && phase === "longBreak");
        if (matchPhase) {
          setRemainingSeconds(minutesToSeconds(nextValue));
        }
      }
    },
    [phase, status],
  );

  const updateLongBreakEvery = useCallback((value: number) => {
    setSettings((prev) => ({
      ...prev,
      longBreakEvery: Math.min(8, Math.max(2, value)),
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      const snapshot = await loadState();
      if (!mounted) return;
      if (snapshot) {
        setTasks(snapshot.tasks ?? []);
        setCurrentTaskId(snapshot.currentTaskId ?? null);
        setSettings({ ...DEFAULT_SETTINGS, ...(snapshot.settings ?? {}) });
        setHistory(snapshot.history ?? {});
        setPhase(snapshot.phase ?? "work");
        setRemainingSeconds(
          snapshot.remainingSeconds ??
            minutesToSeconds(
              phaseMinutes(snapshot.phase ?? "work", snapshot.settings ?? DEFAULT_SETTINGS),
            ),
        );
        setStatus(snapshot.status ?? "idle");
        setWorkSessionsSinceLongBreak(snapshot.workSessionsSinceLongBreak ?? 0);
      }
      setHydrated(true);
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const snapshot: AppStateSnapshot = {
      tasks,
      currentTaskId,
      settings,
      history,
      phase,
      remainingSeconds,
      status,
      workSessionsSinceLongBreak,
    };
    const handle = window.setTimeout(() => {
      void saveState(snapshot);
    }, 300);
    return () => {
      window.clearTimeout(handle);
    };
  }, [
    currentTaskId,
    hydrated,
    history,
    phase,
    remainingSeconds,
    settings,
    status,
    tasks,
    workSessionsSinceLongBreak,
  ]);

  useEffect(() => {
    if (status !== "running") return;
    const handle = window.setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      window.clearInterval(handle);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    if (remainingSeconds > 0) return;
    handlePhaseComplete();
  }, [handlePhaseComplete, remainingSeconds, status]);

  useEffect(() => {
    if (!settings.whiteNoiseEnabled) {
      stopNoise();
      return;
    }
    if (status === "running" && phase === "work") {
      startNoise(settings.whiteNoiseType);
      return;
    }
    stopNoise();
  }, [phase, settings.whiteNoiseEnabled, settings.whiteNoiseType, startNoise, status, stopNoise]);

  useEffect(() => {
    return () => {
      stopNoise();
    };
  }, [stopNoise]);

  return (
    <div className="app-shell px-6 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {viewMode === "main" ? (
          <>
            <section className="mica-panel flex h-full flex-col gap-6 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Pomodoro</p>
                  <h1 className="text-3xl font-semibold text-slate-900">{PHASE_LABEL[phase]}</h1>
                  <p className="mt-2 text-sm text-slate-500">{PHASE_DESCRIPTION[phase]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm text-slate-600">
                    {getPhaseIcon(phase)} {status === "running" ? "进行中" : "就绪"}
                  </div>
                  <button
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white"
                    onClick={() => setViewMode("settings")}
                  >
                    设置
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <TimerCircle remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} />

                <TimerControls
                  status={status}
                  onStart={handleStart}
                  onPause={handlePause}
                  onReset={handleReset}
                  onSkip={handleSkip}
                />

                <PhaseSelector currentPhase={phase} onPhaseChange={setPhaseAndReset} />
              </div>

              <div className="grid gap-4 rounded-2xl border border-white/60 bg-white/60 p-4">
                <CurrentTaskDisplay currentTask={currentTask} onClearTask={handleClearCurrentTask} />
                <TodayStats focusMinutes={todayStats.focusMinutes} sessions={todayStats.sessions} />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div className="mica-panel p-6">
                <h2 className="text-lg font-semibold text-slate-900">计时设置</h2>
                <div className="mt-4">
                  <TimerSettings
                    settings={settings}
                    onUpdateMinutes={updateMinutes}
                    onUpdateLongBreakEvery={updateLongBreakEvery}
                  />
                </div>
              </div>

              <TaskList
                tasks={tasks}
                currentTaskId={currentTaskId}
                filter={taskFilter}
                onFilterChange={setTaskFilter}
                onSelectTask={handleSelectTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleTaskComplete}
                onOpenForm={handleOpenTaskForm}
              />
            </section>
          </>
        ) : (
          <section className="mica-panel col-span-full flex gap-6 p-8">
            {/* 左侧导航 */}
            <nav className="flex w-56 flex-col gap-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">设置</h2>
                <button
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/80 hover:text-slate-600"
                  onClick={() => setViewMode("main")}
                  title="返回"
                >
                  ✕
                </button>
              </div>

              <button
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  settingsTab === "timer"
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-white/60"
                }`}
                onClick={() => setSettingsTab("timer")}
              >
                <span className="text-lg">⏱</span>
                <span>计时设置</span>
              </button>

              <button
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  settingsTab === "preference"
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-white/60"
                }`}
                onClick={() => setSettingsTab("preference")}
              >
                <span className="text-lg">🎨</span>
                <span>偏好设置</span>
              </button>

              <button
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  settingsTab === "other"
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-white/60"
                }`}
                onClick={() => setSettingsTab("other")}
              >
                <span className="text-lg">⚙️</span>
                <span>其他设置</span>
              </button>
            </nav>

            {/* 右侧内容区 */}
            <div className="flex-1">
              {settingsTab === "timer" && (
                <div className="mica-panel p-6">
                  <h3 className="mb-1 text-lg font-semibold text-slate-900">计时设置</h3>
                  <p className="mb-6 text-sm text-slate-500">自定义番茄钟和休息时长</p>
                  <TimerSettings
                    settings={settings}
                    onUpdateMinutes={updateMinutes}
                    onUpdateLongBreakEvery={updateLongBreakEvery}
                  />
                </div>
              )}

              {settingsTab === "preference" && (
                <div className="mica-panel p-6">
                  <h3 className="mb-1 text-lg font-semibold text-slate-900">偏好设置</h3>
                  <p className="mb-6 text-sm text-slate-500">配置声音、白噪音和自动化选项</p>
                  <PreferenceSettings settings={settings} onUpdateSettings={updateSettings} />
                </div>
              )}

              {settingsTab === "other" && (
                <div className="mica-panel p-6">
                  <h3 className="mb-1 text-lg font-semibold text-slate-900">其他设置</h3>
                  <p className="mb-6 text-sm text-slate-500">窗口和系统集成选项</p>
                  <OtherSettings settings={settings} onUpdateSettings={updateSettings} />
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <TaskForm
        isOpen={taskFormOpen}
        editingTask={editingTaskId ? tasks.find((t) => t.id === editingTaskId) ?? null : null}
        onSave={handleSaveTask}
        onClose={() => setTaskFormOpen(false)}
      />
    </div>
  );
};

export default App;
