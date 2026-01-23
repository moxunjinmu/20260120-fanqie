import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeRangeSelector } from './TimeRangeSelector';

describe('TimeRangeSelector', () => {
  it('should render all three time range options', () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector selected="7days" onChange={onChange} />);

    expect(screen.getByText('7天')).toBeInTheDocument();
    expect(screen.getByText('30天')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();
  });

  it('should highlight selected option with primary variant', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TimeRangeSelector selected="7days" onChange={onChange} />);

    // Check that 7天 button has primary variant class
    const button7days = screen.getByText('7天').closest('button');
    expect(button7days?.className).toContain('bg-indigo-600');

    // Check that other buttons have secondary variant class
    const button30days = screen.getByText('30天').closest('button');
    expect(button30days?.className).toContain('bg-slate-900');

    // Change selection
    rerender(<TimeRangeSelector selected="30days" onChange={onChange} />);

    // Now 30天 should have primary variant
    const button30daysUpdated = screen.getByText('30天').closest('button');
    expect(button30daysUpdated?.className).toContain('bg-indigo-600');
  });

  it('should call onChange when a button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeSelector selected="7days" onChange={onChange} />);

    const button30days = screen.getByText('30天');
    await user.click(button30days);

    expect(onChange).toHaveBeenCalledWith('30days');
  });

  it('should call onChange with correct value for each option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeSelector selected="7days" onChange={onChange} />);

    await user.click(screen.getByText('7天'));
    expect(onChange).toHaveBeenCalledWith('7days');

    await user.click(screen.getByText('30天'));
    expect(onChange).toHaveBeenCalledWith('30days');

    await user.click(screen.getByText('全部'));
    expect(onChange).toHaveBeenCalledWith('all');
  });
});
