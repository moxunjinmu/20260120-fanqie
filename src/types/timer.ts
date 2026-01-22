export type Phase = "work" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export interface TimerState {
  phase: Phase;
  remainingSeconds: number;
  status: TimerStatus;
  workSessionsSinceLongBreak: number;
}
