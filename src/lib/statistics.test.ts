import { describe, it, expect } from 'vitest';
import {
  calculateStartDate,
  generateDateRange,
  formatDate,
  validateAndCleanHistory,
  processHistoryData,
  calculateTotals,
} from './statistics';
import { formatDateKey } from './time';
import type { StatsHistory } from '../types/stats';

describe('Statistics Functions', () => {
  describe('calculateStartDate', () => {
    it('should calculate start date for 7 days range', () => {
      const today = new Date('2024-01-15T12:00:00');
      const start = calculateStartDate(today, '7days');
      
      expect(formatDateKey(start)).toBe('2024-01-09');
    });

    it('should calculate start date for 30 days range', () => {
      const today = new Date('2024-01-31T12:00:00');
      const start = calculateStartDate(today, '30days');
      
      expect(formatDateKey(start)).toBe('2024-01-02');
    });

    it('should return epoch for all time range', () => {
      const today = new Date('2024-01-15T12:00:00');
      const start = calculateStartDate(today, 'all');
      
      expect(start.getTime()).toBe(0);
    });
  });

  describe('generateDateRange', () => {
    it('should generate date range for single day', () => {
      const start = new Date('2024-01-15T00:00:00');
      const end = new Date('2024-01-15T00:00:00');
      const range = generateDateRange(start, end);
      
      expect(range).toHaveLength(1);
      expect(formatDateKey(range[0])).toBe('2024-01-15');
    });

    it('should generate date range for multiple days', () => {
      const start = new Date('2024-01-15T00:00:00');
      const end = new Date('2024-01-17T00:00:00');
      const range = generateDateRange(start, end);
      
      expect(range).toHaveLength(3);
      expect(formatDateKey(range[0])).toBe('2024-01-15');
      expect(formatDateKey(range[1])).toBe('2024-01-16');
      expect(formatDateKey(range[2])).toBe('2024-01-17');
    });
  });

  describe('formatDate', () => {
    it('should format today as "今天"', () => {
      const today = new Date();
      const dateStr = formatDateKey(today);
      
      expect(formatDate(dateStr)).toBe('今天');
    });

    it('should format yesterday as "昨天"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = formatDateKey(yesterday);
      
      expect(formatDate(dateStr)).toBe('昨天');
    });

    it('should format other dates as "月日"', () => {
      const result = formatDate('2024-01-15');
      
      expect(result).toBe('1月15日');
    });
  });

  describe('validateAndCleanHistory', () => {
    it('should clean valid history data', () => {
      const history: StatsHistory = {
        '2024-01-15': {
          date: '2024-01-15',
          focusMinutes: 120,
          completedPomodoros: 5,
        },
      };
      
      const cleaned = validateAndCleanHistory(history);
      
      expect(cleaned['2024-01-15']).toEqual({
        date: '2024-01-15',
        focusMinutes: 120,
        completedPomodoros: 5,
      });
    });

    it('should skip invalid date formats', () => {
      const history: StatsHistory = {
        'invalid-date': {
          date: 'invalid-date',
          focusMinutes: 120,
          completedPomodoros: 5,
        },
        '2024-01-15': {
          date: '2024-01-15',
          focusMinutes: 60,
          completedPomodoros: 3,
        },
      };
      
      const cleaned = validateAndCleanHistory(history);
      
      expect(cleaned['invalid-date']).toBeUndefined();
      expect(cleaned['2024-01-15']).toBeDefined();
    });

    it('should use default values for missing fields', () => {
      const history: any = {
        '2024-01-15': {
          date: '2024-01-15',
          // Missing focusMinutes and completedPomodoros
        },
      };
      
      const cleaned = validateAndCleanHistory(history);
      
      expect(cleaned['2024-01-15']).toEqual({
        date: '2024-01-15',
        focusMinutes: 0,
        completedPomodoros: 0,
      });
    });
  });

  describe('processHistoryData', () => {
    it('should process history data and fill missing dates', () => {
      const history: StatsHistory = {
        '2024-01-13': {
          date: '2024-01-13',
          focusMinutes: 120,
          completedPomodoros: 5,
        },
        '2024-01-15': {
          date: '2024-01-15',
          focusMinutes: 90,
          completedPomodoros: 4,
        },
      };
      
      const result = processHistoryData(history, '7days');
      
      // Should have 7 days of data
      expect(result.length).toBeGreaterThanOrEqual(7);
      
      // Should include the dates with data
      const jan13 = result.find(d => d.date === '2024-01-13');
      const jan15 = result.find(d => d.date === '2024-01-15');
      
      if (jan13) {
        expect(jan13.focusMinutes).toBe(120);
        expect(jan13.completedPomodoros).toBe(5);
      }
      
      if (jan15) {
        expect(jan15.focusMinutes).toBe(90);
        expect(jan15.completedPomodoros).toBe(4);
      }
    });

    it('should fill missing dates with zero values', () => {
      const history: StatsHistory = {
        '2024-01-15': {
          date: '2024-01-15',
          focusMinutes: 120,
          completedPomodoros: 5,
        },
      };
      
      const result = processHistoryData(history, '30days');
      
      // Should have 30 days of data
      expect(result.length).toBeGreaterThanOrEqual(30);
      
      // Most dates should have zero values (since we only have one date with data)
      const zeroValueDates = result.filter(d => d.focusMinutes === 0 && d.completedPomodoros === 0);
      expect(zeroValueDates.length).toBeGreaterThan(20);
    });

    it('should return empty array for all range with no history', () => {
      const history: StatsHistory = {};
      
      const result = processHistoryData(history, 'all');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate totals correctly', () => {
      const data = [
        { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 5 },
        { date: '2024-01-16', focusMinutes: 90, completedPomodoros: 4 },
        { date: '2024-01-17', focusMinutes: 60, completedPomodoros: 3 },
      ];
      
      const totals = calculateTotals(data);
      
      expect(totals.totalMinutes).toBe(270);
      expect(totals.totalPomodoros).toBe(12);
    });

    it('should return zero for empty data', () => {
      const data: any[] = [];
      
      const totals = calculateTotals(data);
      
      expect(totals.totalMinutes).toBe(0);
      expect(totals.totalPomodoros).toBe(0);
    });
  });
});
