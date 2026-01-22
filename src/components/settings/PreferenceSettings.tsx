import { memo } from "react";
import type { NoiseType, Settings } from "../../types";

interface PreferenceSettingsProps {
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
}

export const PreferenceSettings = memo<PreferenceSettingsProps>(
  ({ settings, onUpdateSettings }) => {
    return (
      <div className="grid gap-3 text-sm text-slate-600">
        <label className="flex items-center justify-between gap-4">
          <span>自动开始下一阶段</span>
          <input
            type="checkbox"
            checked={settings.autoStartNext}
            onChange={(event) => onUpdateSettings({ autoStartNext: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>结束提示音</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(event) => onUpdateSettings({ soundEnabled: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>专注白噪音</span>
          <input
            type="checkbox"
            checked={settings.whiteNoiseEnabled}
            onChange={(event) => onUpdateSettings({ whiteNoiseEnabled: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>白噪音类型</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1"
            value={settings.whiteNoiseType}
            onChange={(event) =>
              onUpdateSettings({ whiteNoiseType: event.target.value as NoiseType })
            }
          >
            <option value="rain">雨声</option>
            <option value="cafe">咖啡馆</option>
            <option value="fire">篝火</option>
          </select>
        </label>
      </div>
    );
  },
);

PreferenceSettings.displayName = "PreferenceSettings";
