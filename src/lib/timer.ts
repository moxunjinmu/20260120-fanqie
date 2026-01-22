import type { Phase, Settings } from "../types";

export const phaseMinutes = (phase: Phase, settings: Settings): number => {
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

export const getNextPhase = (
  phase: Phase,
  workSessionsSinceLongBreak: number,
  settings: Settings,
  completedWorkSession: boolean,
): { nextPhase: Phase; nextWorkSessions: number } => {
  if (phase === "work") {
    const updatedSessions = completedWorkSession
      ? workSessionsSinceLongBreak + 1
      : workSessionsSinceLongBreak;
    if (completedWorkSession && updatedSessions >= settings.longBreakEvery) {
      return { nextPhase: "longBreak", nextWorkSessions: 0 };
    }
    return { nextPhase: "shortBreak", nextWorkSessions: updatedSessions };
  }
  return { nextPhase: "work", nextWorkSessions: workSessionsSinceLongBreak };
};

export const clampMinutes = (value: number): number => {
  return Math.min(120, Math.max(1, value));
};
