import { memo } from 'react';
import { Button } from '../ui/Button';
import type { TimeRange } from '../../types/statistics';

export interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const options: { value: TimeRange; label: string }[] = [
  { value: '7days', label: '7天' },
  { value: '30days', label: '30天' },
  { value: 'all', label: '全部' },
];

export const TimeRangeSelector = memo<TimeRangeSelectorProps>(({ selected, onChange }) => {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={selected === option.value ? 'primary' : 'secondary'}
          onClick={() => onChange(option.value)}
          className="cursor-pointer transition-colors duration-200"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
});

TimeRangeSelector.displayName = 'TimeRangeSelector';
