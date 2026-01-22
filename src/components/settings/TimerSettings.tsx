import { memo } from "react";
import type { Settings } from "../../types";

interface TimerSettingsProps {
  settings: Settings;
  onUpdateMinutes: (
    key: "workMinutes" | "shortBreakMinutes" | "longBreakMinutes",
    value: number,
  ) => void;
  onUpdateLongBreakEvery: (value: number) => void;
}

export const TimerSettings = memo<TimerSettingsProps>(
  ({ settings, onUpdateMinutes, onUpdateLongBreakEvery }) => {
    return (
      <div className="grid gap-4 text-sm text-slate-600">
        <label className="flex items-center justify-between gap-4">
          <span>专注时长（分钟）</span>
          <input
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
            type="number"
            min={1}
            max={120}
            value={settings.workMinutes}
            onChange={(event) => onUpdateMinutes("workMinutes", Number(event.target.value))}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>短休时长（分钟）</span>
          <input
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
            type="number"
            min={1}
            max={120}
            value={settings.shortBreakMinutes}
            onChange={(event) => onUpdateMinutes("shortBreakMinutes", Number(event.target.value))}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>长休时长（分钟）</span>
          <input
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
            type="number"
            min={1}
            max={120}
            value={settings.longBreakMinutes}
            onChange={(event) => onUpdateMinutes("longBreakMinutes", Number(event.target.value))}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>每轮长休间隔</span>
          <input
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-right"
            type="number"
            min={2}
            max={8}
            value={settings.longBreakEvery}
            onChange={(event) => onUpdateLongBreakEvery(Number(event.target.value))}
          />
        </label>
      </div>
    );
  },
);

TimerSettings.displayName = "TimerSettings";
