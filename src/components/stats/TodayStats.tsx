import { memo } from "react";

interface TodayStatsProps {
  focusMinutes: number;
  sessions: number;
}

export const TodayStats = memo<TodayStatsProps>(({ focusMinutes, sessions }) => {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">今日专注</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{focusMinutes} 分钟</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">完成番茄</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{sessions} 次</p>
      </div>
    </div>
  );
});

TodayStats.displayName = "TodayStats";
