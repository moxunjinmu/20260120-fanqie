import type { DailyStat } from "../types";

export const getDefaultDailyStat = (dateKey: string): DailyStat => ({
  date: dateKey,
  focusMinutes: 0,
  sessions: 0,
});
