import { memo } from 'react';
import type { ChartDataPoint } from '../../types/statistics';
import { formatDate } from '../../lib/statistics';

export interface HistoryListItemProps {
  data: ChartDataPoint;
}

export const HistoryListItem = memo<HistoryListItemProps>(({ data }) => {
  const formattedDate = formatDate(data.date);

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer">
      <span className="text-sm font-medium text-white">{formattedDate}</span>
      <div className="flex gap-4 text-sm">
        <span className="text-indigo-400">{data.focusMinutes} 分钟</span>
        <span className="text-emerald-400">{data.completedPomodoros} 个番茄</span>
      </div>
    </div>
  );
});

HistoryListItem.displayName = 'HistoryListItem';
