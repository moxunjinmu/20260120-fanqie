export type Phase = "work" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export type NoiseType = "rain" | "cafe" | "fire";

export interface Task {
  id: string;
  title: string;
  estPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  createdAt: number;
}

export interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  autoStartNext: boolean;
  soundEnabled: boolean;
  whiteNoiseEnabled: boolean;
  whiteNoiseType: NoiseType;
  miniMode: boolean;
  minimizeToTray: boolean;
}

export interface DailyStat {
  date: string;
  focusMinutes: number;
  sessions: number;
}

export interface StatsHistory {
  [date: string]: DailyStat;
}

export interface AppStateSnapshot {
  tasks: Task[];
  currentTaskId: string | null;
  settings: Settings;
  history: StatsHistory;
  phase: Phase;
  remainingSeconds: number;
  status: TimerStatus;
  workSessionsSinceLongBreak: number;
}
