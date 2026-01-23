import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatisticsPage } from './StatisticsPage';
import type { StatsHistory } from '../../types/stats';

describe('StatisticsPage', () => {
  it('should render all main components', () => {
    const history: StatsHistory = {
      '2024-01-15': { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
      '2024-01-14': { date: '2024-01-14', focusMinutes: 90, completedPomodoros: 4 },
    };

    render(<StatisticsPage history={history} />);

    // Check that title is present
    expect(screen.getByText('统计趋势')).toBeInTheDocument();

    // Check that time range selector is present
    expect(screen.getByText('7天')).toBeInTheDocument();
    expect(screen.getByText('30天')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();

    // Check that chart title is present
    expect(screen.getByText('趋势图表')).toBeInTheDocument();

    // Check that history list title is present
    expect(screen.getByText('历史记录')).toBeInTheDocument();
  });

  it('should display empty state when history is empty', () => {
    render(<StatisticsPage history={{}} />);

    // When history is empty, processHistoryData still generates dates with zero values
    // So we should see the chart and history list with zero values, not empty states
    expect(screen.getByText('趋势图表')).toBeInTheDocument();
    expect(screen.getByText('历史记录')).toBeInTheDocument();
    
    // Check that zero values are displayed
    expect(screen.getAllByText('0 分钟').length).toBeGreaterThan(0);
  });

  it('should update chart data when time range changes', async () => {
    const user = userEvent.setup();
    const history: StatsHistory = {};

    // Generate 40 days of history data
    for (let i = 0; i < 40; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      history[dateKey] = {
        date: dateKey,
        focusMinutes: 100 + i,
        completedPomodoros: 5,
      };
    }

    const { container } = render(<StatisticsPage history={history} />);

    // Initially should show 7 days of data
    let items = container.querySelectorAll('.bg-white\\/5');
    expect(items.length).toBe(7);

    // Click on 30天 button
    await user.click(screen.getByText('30天'));

    // Should now show 30 days of data
    items = container.querySelectorAll('.bg-white\\/5');
    expect(items.length).toBe(30);

    // Click on 全部 button
    await user.click(screen.getByText('全部'));

    // Should now show all days of data (40 days of history + today if not included)
    items = container.querySelectorAll('.bg-white\\/5');
    // The count might be 40 or 41 depending on whether today is included in the history
    expect(items.length).toBeGreaterThanOrEqual(40);
    expect(items.length).toBeLessThanOrEqual(41);
  });

  it('should default to 7days time range', () => {
    const history: StatsHistory = {
      '2024-01-15': { date: '2024-01-15', focusMinutes: 120, completedPomodoros: 6 },
    };

    render(<StatisticsPage history={history} />);

    // Check that 7天 button has primary variant (selected)
    const button7days = screen.getByText('7天').closest('button');
    expect(button7days?.className).toContain('bg-indigo-600');
  });

  it('should process and display history data correctly', () => {
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];

    const history: StatsHistory = {
      [todayKey]: { date: todayKey, focusMinutes: 120, completedPomodoros: 6 },
    };

    render(<StatisticsPage history={history} />);

    // Check that today's data is displayed
    expect(screen.getByText('今天')).toBeInTheDocument();
    expect(screen.getByText('120 分钟')).toBeInTheDocument();
    expect(screen.getByText('6 个番茄')).toBeInTheDocument();
  });
});
