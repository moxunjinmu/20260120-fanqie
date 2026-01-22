export * from "./timer";
export * from "./task";
export * from "./settings";
export * from "./stats";

import type { Task } from "./task";
import type { Settings } from "./settings";
import type { StatsHistory } from "./stats";
import type { Phase, TimerStatus } from "./timer";

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

export type ViewMode = "main" | "settings";
