import { memo, useState, useMemo } from 'react';
import type { StatsHistory } from '../../types/stats';
import type { TimeRange } from '../../types/statistics';
import { processHistoryData } from '../../lib/statistics';
import { TimeRangeSelector } from './TimeRangeSelector';
import { TrendChart } from './TrendChart';
import { HistoryList } from './HistoryList';

export interface StatisticsPageProps {
  history: StatsHistory;
}

export const StatisticsPage = memo<StatisticsPageProps>(({ history }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');

  // Process history data based on selected time range
  const chartData = useMemo(
    () => processHistoryData(history, timeRange),
    [history, timeRange]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">统计趋势</h2>
        <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
      </div>

      <TrendChart data={chartData} />

      <HistoryList data={chartData} />
    </div>
  );
});

StatisticsPage.displayName = 'StatisticsPage';
