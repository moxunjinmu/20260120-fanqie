export interface DailyStat {
  date: string;
  focusMinutes: number;
  sessions: number;
}

export interface StatsHistory {
  [date: string]: DailyStat;
}
