export interface DailyStat {
  date: string;
  focusMinutes: number;
  completedPomodoros: number;
}

export interface StatsHistory {
  [date: string]: DailyStat;
}
