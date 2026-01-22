import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { formatDateKey, formatSeconds, minutesToSeconds } from "./lib/time";
import { isTauri } from "./lib/tauri";
import { loadState, saveState } from "./lib/store";
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
  const [taskFormTitle, setTaskFormTitle] = useState("");
  const [taskFormEstPomodoros, setTaskFormEstPomodoros] = useState(1);
  const [taskFilter, setTaskFilter] = useState<"active" | "completed">("active");

  const totalSeconds = useMemo(
    () => minutesToSeconds(phaseMinutes(phase, settings)),
    [phase, settings],
  );

  const progressRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const todayKey = formatDateKey(new Date());
  const todayStats = history[todayKey] ?? getDefaultDailyStat(todayKey);

  const currentTask = useMemo(
    () => tasks.find((task) => task.id === currentTaskId) ?? null,
    [tasks, currentTaskId],
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (taskFilter === "active") return !task.completed;
        return task.completed;
      }),
    [tasks, taskFilter],
  );

  const sortedTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) => {
        if (taskFilter === "active") {
          return a.createdAt - b.createdAt;
        }
        return b.createdAt - a.createdAt;
      }),
    [filteredTasks, taskFilter],
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
    setTaskFormTitle("");
    setTaskFormEstPomodoros(1);
    setTaskFormOpen(true);
  }, []);

  const handleEditTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setEditingTaskId(taskId);
        setTaskFormTitle(task.title);
        setTaskFormEstPomodoros(task.estPomodoros);
        setTaskFormOpen(true);
      }
    },
    [tasks],
  );

  const handleSaveTask = useCallback(() => {
    const trimmedTitle = taskFormTitle.trim();
    if (!trimmedTitle) return;

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTaskId
            ? { ...task, title: trimmedTitle, estPomodoros: taskFormEstPomodoros }
            : task,
        ),
      );
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        estPomodoros: taskFormEstPomodoros,
        completedPomodoros: 0,
        completed: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [...prev, newTask]);
    }
    setTaskFormOpen(false);
    setEditingTaskId(null);
    setTaskFormTitle("");
    setTaskFormEstPomodoros(1);
  }, [editingTaskId, taskFormTitle, taskFormEstPomodoros]);

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
                <div className="relative flex h-56 w-56 items-center justify-center">
                  <svg className="h-full w-full progress-ring" viewBox="0 0 220 220">
                    <circle
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.25)"
                      strokeWidth="14"
                    />
                    <circle
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="none"
                      stroke="url(#timerGradient)"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                    <defs>
                      <linearGradient id="timerGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-4xl font-semibold text-slate-900 text-shadow-soft">
                      {formatSeconds(remainingSeconds)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {Math.ceil(remainingSeconds / 60)} min left
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {status === "running" ? (
                    <button
                      className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-glass"
                      onClick={handlePause}
                    >
                      暂停
                    </button>
                  ) : (
                    <button
                      className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-glass"
                      onClick={handleStart}
                    >
                      {status === "paused" ? "继续" : "开始"}
                    </button>
                  )}
                  <button
                    className="rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600"
                    onClick={handleReset}
                  >
                    重置
                  </button>
                  <button
                    className="rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600"
                    onClick={handleSkip}
                  >
                    跳过
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(["work", "shortBreak", "longBreak"] as Phase[]).map((item) => (
                    <button
                      key={item}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        phase === item
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-white/70 text-slate-500"
                      }`}
                      onClick={() => setPhaseAndReset(item)}
                    >
                      {PHASE_LABEL[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-white/60 bg-white/60 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">当前任务</p>
                  {currentTask ? (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-slate-700">{currentTask.title}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>{currentTask.completedPomodoros}</span>
                        <span className="text-slate-300">/</span>
                        <span>{currentTask.estPomodoros}</span>
                        <button
                          className="ml-2 rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-xs text-slate-600 hover:bg-white"
                          onClick={handleClearCurrentTask}
                        >
                          切换
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">未选择任务</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">今日专注</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {todayStats.focusMinutes} 分钟
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">完成番茄</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {todayStats.sessions} 次
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div className="mica-panel p-6">
                <h2 className="text-lg font-semibold text-slate-900">计时设置</h2>
                <div className="mt-4 grid gap-4 text-sm text-slate-600">
                  <label className="flex items-center justify-between gap-4">
                    <span>专注时长（分钟）</span>
                    <input
                      className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                      type="number"
                      min={1}
                      max={120}
                      value={settings.workMinutes}
                      onChange={(event) => updateMinutes("workMinutes", Number(event.target.value))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span>短休时长（分钟）</span>
                    <input
                      className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                      type="number"
                      min={1}
                      max={120}
                      value={settings.shortBreakMinutes}
                      onChange={(event) =>
                        updateMinutes("shortBreakMinutes", Number(event.target.value))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span>长休时长（分钟）</span>
                    <input
                      className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                      type="number"
                      min={1}
                      max={120}
                      value={settings.longBreakMinutes}
                      onChange={(event) =>
                        updateMinutes("longBreakMinutes", Number(event.target.value))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span>每轮长休间隔</span>
                    <input
                      className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                      type="number"
                      min={2}
                      max={8}
                      value={settings.longBreakEvery}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          longBreakEvery: Math.min(8, Math.max(2, Number(event.target.value))),
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="mica-panel flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">任务列表</h2>
                  <button
                    className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-glass transition hover:bg-indigo-700"
                    onClick={handleOpenTaskForm}
                  >
                    + 新增任务
                  </button>
                </div>

                <div className="flex gap-2 rounded-lg bg-white/60 p-1">
                  <button
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      taskFilter === "active" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"
                    }`}
                    onClick={() => setTaskFilter("active")}
                  >
                    待办 ({tasks.filter((t) => !t.completed).length})
                  </button>
                  <button
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      taskFilter === "completed" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"
                    }`}
                    onClick={() => setTaskFilter("completed")}
                  >
                    已完成 ({tasks.filter((t) => t.completed).length})
                  </button>
                </div>

                <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto scrollbar-hidden">
                  {sortedTasks.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      {taskFilter === "active" ? "暂无待办任务" : "暂无已完成任务"}
                    </p>
                  ) : (
                    sortedTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`group rounded-xl border p-3 transition ${
                          currentTaskId === task.id
                            ? "border-indigo-300 bg-indigo-50/50"
                            : "border-white/60 bg-white/60 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p
                              className={`text-sm font-medium ${
                                task.completed ? "text-slate-400 line-through" : "text-slate-700"
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>
                                {task.completedPomodoros}/{task.estPomodoros}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>🍅 x {task.estPomodoros}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {taskFilter === "active" && (
                              <>
                                <button
                                  className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-white hover:text-indigo-600 group-hover:opacity-100"
                                  onClick={() => handleEditTask(task.id)}
                                  title="编辑"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-white hover:text-red-500 group-hover:opacity-100"
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="删除"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                            {taskFilter === "completed" && (
                              <button
                                className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-white hover:text-amber-500 group-hover:opacity-100"
                                onClick={() => handleToggleTaskComplete(task.id)}
                                title="恢复为待办"
                              >
                                ↩️
                              </button>
                            )}
                          </div>
                        </div>
                        {taskFilter === "active" && (
                          <button
                            className={`mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              currentTaskId === task.id
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-200 bg-white/80 text-slate-600 hover:bg-white"
                            }`}
                            onClick={() => handleSelectTask(task.id)}
                          >
                            {currentTaskId === task.id ? "当前任务" : "选择此任务"}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="mica-panel col-span-full max-w-2xl mx-auto flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">设置</h2>
              <button
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
                onClick={() => setViewMode("main")}
              >
                返回
              </button>
            </div>

            <div className="mica-panel p-6">
              <h3 className="text-lg font-semibold text-slate-900">计时设置</h3>
              <div className="mt-4 grid gap-4 text-sm text-slate-600">
                <label className="flex items-center justify-between gap-4">
                  <span>专注时长（分钟）</span>
                  <input
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                    type="number"
                    min={1}
                    max={120}
                    value={settings.workMinutes}
                    onChange={(event) => updateMinutes("workMinutes", Number(event.target.value))}
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>短休时长（分钟）</span>
                  <input
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                    type="number"
                    min={1}
                    max={120}
                    value={settings.shortBreakMinutes}
                    onChange={(event) =>
                      updateMinutes("shortBreakMinutes", Number(event.target.value))
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>长休时长（分钟）</span>
                  <input
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                    type="number"
                    min={1}
                    max={120}
                    value={settings.longBreakMinutes}
                    onChange={(event) =>
                      updateMinutes("longBreakMinutes", Number(event.target.value))
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>每轮长休间隔</span>
                  <input
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
                    type="number"
                    min={2}
                    max={8}
                    value={settings.longBreakEvery}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        longBreakEvery: Math.min(8, Math.max(2, Number(event.target.value))),
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mica-panel p-6">
              <h3 className="text-lg font-semibold text-slate-900">偏好设置</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <label className="flex items-center justify-between gap-4">
                  <span>自动开始下一阶段</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartNext}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, autoStartNext: event.target.checked }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>结束提示音</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, soundEnabled: event.target.checked }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>专注白噪音</span>
                  <input
                    type="checkbox"
                    checked={settings.whiteNoiseEnabled}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, whiteNoiseEnabled: event.target.checked }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>白噪音类型</span>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1"
                    value={settings.whiteNoiseType}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        whiteNoiseType: event.target.value as NoiseType,
                      }))
                    }
                  >
                    <option value="rain">雨声</option>
                    <option value="cafe">咖啡馆</option>
                    <option value="fire">篝火</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mica-panel p-6">
              <h3 className="text-lg font-semibold text-slate-900">其他设置</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <label className="flex items-center justify-between gap-4">
                  <span>迷你模式（悬浮窗）</span>
                  <input
                    type="checkbox"
                    checked={settings.miniMode}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, miniMode: event.target.checked }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span>最小化到系统托盘</span>
                  <input
                    type="checkbox"
                    checked={settings.minimizeToTray}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, minimizeToTray: event.target.checked }))
                    }
                  />
                </label>
              </div>
            </div>
          </section>
        )}
      </div>

      {taskFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mica-panel w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingTaskId ? "编辑任务" : "新增任务"}
            </h3>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">任务名称</label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                  type="text"
                  placeholder="输入任务名称..."
                  value={taskFormTitle}
                  onChange={(event) => setTaskFormTitle(event.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">预估番茄数</label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                  type="number"
                  min={1}
                  max={20}
                  value={taskFormEstPomodoros}
                  onChange={(event) =>
                    setTaskFormEstPomodoros(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
                  }
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-full border border-slate-200 bg-white/80 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
                onClick={() => setTaskFormOpen(false)}
              >
                取消
              </button>
              <button
                className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-glass hover:bg-indigo-700"
                onClick={handleSaveTask}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
