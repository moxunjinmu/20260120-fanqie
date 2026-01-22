import { memo } from "react";
import type { Settings } from "../../types";

interface OtherSettingsProps {
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
}

export const OtherSettings = memo<OtherSettingsProps>(({ settings, onUpdateSettings }) => {
  return (
    <div className="grid gap-3 text-sm text-slate-600">
      <label className="flex items-center justify-between gap-4">
        <span>迷你模式（悬浮窗）</span>
        <input
          type="checkbox"
          checked={settings.miniMode}
          onChange={(event) => onUpdateSettings({ miniMode: event.target.checked })}
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        <span>最小化到系统托盘</span>
        <input
          type="checkbox"
          checked={settings.minimizeToTray}
          onChange={(event) => onUpdateSettings({ minimizeToTray: event.target.checked })}
        />
      </label>
    </div>
  );
});

OtherSettings.displayName = "OtherSettings";
