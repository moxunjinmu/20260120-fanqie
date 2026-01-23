import { memo, useMemo } from 'react';
import { Panel } from '../ui/Panel';
import { EmptyState } from './EmptyState';
import { HistoryListItem } from './HistoryListItem';
import type { ChartDataPoint } from '../../types/statistics';

export interface HistoryListProps {
  data: ChartDataPoint[];
}

export const HistoryList = memo<HistoryListProps>(({ data }) => {
  // Sort data in reverse chronological order (newest first)
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.date.localeCompare(a.date)),
    [data]
  );

  if (sortedData.length === 0) {
    return <EmptyState message="暂无历史记录" />;
  }

  return (
    <Panel className="space-y-4">
      <h3 className="text-lg font-semibold text-white">历史记录</h3>
      <div className="space-y-2">
        {sortedData.map((item) => (
          <HistoryListItem key={item.date} data={item} />
        ))}
      </div>
    </Panel>
  );
});

HistoryList.displayName = 'HistoryList';
