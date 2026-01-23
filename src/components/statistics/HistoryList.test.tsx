import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryList } from './HistoryList';
import type { ChartDataPoint } from '../../types/statistics';

describe('HistoryList', () => {
  it('should display EmptyState when data is empty', () => {
    render(<HistoryList data={[]} />);

    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
  });

  it('should render all history items', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
      { date: '2024-01-14', focusMinutes: 90, completedPomodoros: 4 },
      { date: '2024-01-13', focusMinutes: 150, completedPomodoros: 7 },
    ];

    render(<HistoryList data={data} />);

    expect(screen.getByText('120 分钟')).toBeInTheDocument();
    expect(screen.getByText('90 分钟')).toBeInTheDocument();
    expect(screen.getByText('150 分钟')).toBeInTheDocument();
  });

  it('should sort data in reverse chronological order', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-13', focusMinutes: 150, completedPomodoros: 7 },
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
      { date: '2024-01-14', focusMinutes: 90, completedPomodoros: 4 },
    ];

    const { container } = render(<HistoryList data={data} />);

    // Get all history items
    const items = container.querySelectorAll('.bg-white\\/5');

    // Check that items are in reverse chronological order
    // First item should be 2024-01-15 (newest)
    expect(items[0].textContent).toContain('120 分钟');
    // Second item should be 2024-01-14
    expect(items[1].textContent).toContain('90 分钟');
    // Third item should be 2024-01-13 (oldest)
    expect(items[2].textContent).toContain('150 分钟');
  });

  it('should display the title "历史记录"', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
    ];

    render(<HistoryList data={data} />);

    expect(screen.getByText('历史记录')).toBeInTheDocument();
  });

  it('should not mutate the original data array', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-13', focusMinutes: 150, completedPomodoros: 7 },
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
    ];

    const originalOrder = [...data];
    render(<HistoryList data={data} />);

    // Original array should remain unchanged
    expect(data).toEqual(originalOrder);
  });
});
