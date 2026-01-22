import type { Phase, Settings } from "../types";

export const PHASE_LABEL: Record<Phase, string> = {
  work: "专注",
  shortBreak: "短休息",
  longBreak: "长休息",
};

export const PHASE_DESCRIPTION: Record<Phase, string> = {
  work: "保持专注，完成当前任务",
  shortBreak: "放松一下，准备下一轮",
  longBreak: "深度休息，恢复精力",
};

export const PHASE_ICON: Record<Phase, string> = {
  work: "⏱",
  shortBreak: "☕",
  longBreak: "🌿",
};

export const DEFAULT_SETTINGS: Settings = {
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

export const TIMER_RADIUS = 100;
export const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;
