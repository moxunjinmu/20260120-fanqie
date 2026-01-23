/**
 * Time range options for statistics filtering
 */
export type TimeRange = '7days' | '30days' | 'all';

/**
 * Data point for chart visualization
 */
export interface ChartDataPoint {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total focus minutes for this date */
  focusMinutes: number;
  /** Number of completed pomodoros for this date */
  completedPomodoros: number;
}
