import type { StatsHistory } from '../types/stats';
import type { TimeRange, ChartDataPoint } from '../types/statistics';
import { formatDateKey, addDays, startOfDay } from './time';

/**
 * Calculate the start date based on the selected time range
 * @param today - The current date
 * @param timeRange - The selected time range ('7days', '30days', or 'all')
 * @returns The start date for the time range
 */
export function calculateStartDate(today: Date, timeRange: TimeRange): Date {
  const start = startOfDay(today);
  
  switch (timeRange) {
    case '7days':
      // Include today, so go back 6 days (today + 6 previous days = 7 days)
      return addDays(start, -6);
    case '30days':
      // Include today, so go back 29 days (today + 29 previous days = 30 days)
      return addDays(start, -29);
    case 'all':
      // Return a very early date (will be adjusted based on actual history data)
      return new Date(0);
  }
}

/**
 * Generate an array of dates between start and end (inclusive)
 * @param start - The start date
 * @param end - The end date
 * @returns Array of dates from start to end
 */
export function generateDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  const endTime = end.getTime();
  
  while (current.getTime() <= endTime) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Format a date string to a friendly display format
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Friendly formatted date string (e.g., "今天", "昨天", "1月15日")
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00'); // Add time to avoid timezone issues
  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  
  const dateKey = formatDateKey(date);
  const todayKey = formatDateKey(today);
  const yesterdayKey = formatDateKey(yesterday);
  
  if (dateKey === todayKey) {
    return '今天';
  } else if (dateKey === yesterdayKey) {
    return '昨天';
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

/**
 * Validate and clean history data
 * Handles format errors, missing fields, and invalid dates
 * @param history - The raw history data
 * @returns Cleaned and validated history data
 */
export function validateAndCleanHistory(history: StatsHistory): StatsHistory {
  const cleaned: StatsHistory = {};
  
  for (const [dateKey, stat] of Object.entries(history)) {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      console.warn(`[Statistics] Invalid date format: ${dateKey}`);
      continue;
    }
    
    // Validate stat object
    if (typeof stat !== 'object' || stat === null) {
      console.warn(`[Statistics] Invalid stat object for date: ${dateKey}`);
      continue;
    }
    
    // Clean and use default values for missing fields
    cleaned[dateKey] = {
      date: dateKey,
      focusMinutes: typeof stat.focusMinutes === 'number' ? stat.focusMinutes : 0,
      completedPomodoros: typeof stat.completedPomodoros === 'number' ? stat.completedPomodoros : 0,
    };
  }
  
  return cleaned;
}

/**
 * Process history data for the selected time range
 * Filters data, fills missing dates with zero values, and returns sorted data points
 * @param history - The history data from the store
 * @param timeRange - The selected time range
 * @returns Array of chart data points sorted by date
 */
export function processHistoryData(
  history: StatsHistory,
  timeRange: TimeRange
): ChartDataPoint[] {
  // Validate and clean the history data first
  const cleanedHistory = validateAndCleanHistory(history);
  
  const today = startOfDay(new Date());
  let startDate = calculateStartDate(today, timeRange);
  
  // For 'all' time range, find the earliest date in history
  if (timeRange === 'all') {
    const historyDates = Object.keys(cleanedHistory);
    if (historyDates.length === 0) {
      // No history data, return empty array
      return [];
    }
    
    // Find the earliest date
    const earliestDateStr = historyDates.sort()[0];
    startDate = new Date(earliestDateStr + 'T00:00:00');
  }
  
  // Generate all dates in the range
  const dateRange = generateDateRange(startDate, today);
  
  // Map dates to chart data points, filling missing dates with zero values
  const dataPoints: ChartDataPoint[] = dateRange.map(date => {
    const dateKey = formatDateKey(date);
    const stat = cleanedHistory[dateKey];
    
    return {
      date: dateKey,
      focusMinutes: stat?.focusMinutes || 0,
      completedPomodoros: stat?.completedPomodoros || 0,
    };
  });
  
  return dataPoints;
}

/**
 * Calculate totals for the given data points
 * @param data - Array of chart data points
 * @returns Object containing total minutes and total pomodoros
 */
export function calculateTotals(data: ChartDataPoint[]): {
  totalMinutes: number;
  totalPomodoros: number;
} {
  return data.reduce(
    (acc, point) => ({
      totalMinutes: acc.totalMinutes + point.focusMinutes,
      totalPomodoros: acc.totalPomodoros + point.completedPomodoros,
    }),
    { totalMinutes: 0, totalPomodoros: 0 }
  );
}
