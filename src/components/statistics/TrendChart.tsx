import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Panel } from '../ui/Panel';
import { EmptyState } from './EmptyState';
import type { ChartDataPoint } from '../../types/statistics';

export interface TrendChartProps {
  data: ChartDataPoint[];
}

export const TrendChart = memo<TrendChartProps>(({ data }) => {
  if (data.length === 0) {
    return <EmptyState message="暂无数据" />;
  }

  return (
    <Panel className="space-y-4">
      <h3 className="text-lg font-semibold text-white">趋势图表</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend
            wrapperStyle={{
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="focusMinutes"
            fill="#818cf8"
            name="专注分钟"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="completedPomodoros"
            fill="#34d399"
            name="完成番茄"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
});

TrendChart.displayName = 'TrendChart';
