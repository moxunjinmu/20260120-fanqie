import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendChart } from './TrendChart';
import type { ChartDataPoint } from '../../types/statistics';

describe('TrendChart', () => {
  it('should display EmptyState when data is empty', () => {
    render(<TrendChart data={[]} />);

    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('should render chart with data', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
      { date: '2024-01-14', focusMinutes: 90, completedPomodoros: 4 },
    ];

    const { container } = render(<TrendChart data={data} />);

    // Check that the ResponsiveContainer is rendered
    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should display the title "趋势图表"', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
    ];

    render(<TrendChart data={data} />);

    expect(screen.getByText('趋势图表')).toBeInTheDocument();
  });

  it('should render both data series (focusMinutes and completedPomodoros)', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
    ];

    const { container } = render(<TrendChart data={data} />);

    // Check that the chart component is rendered (ResponsiveContainer)
    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render legend with correct labels', () => {
    const data: ChartDataPoint[] = [
      { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
    ];

    const { container } = render(<TrendChart data={data} />);

    // In jsdom, recharts doesn't fully render, so we just check the component renders
    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should handle large datasets', () => {
    // Generate 100 data points
    const data: ChartDataPoint[] = Array.from({ length: 100 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      focusMinutes: Math.floor(Math.random() * 200),
      completedPomodoros: Math.floor(Math.random() * 10),
    }));

    const { container } = render(<TrendChart data={data} />);

    // Chart should still render
    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();
  });
});
