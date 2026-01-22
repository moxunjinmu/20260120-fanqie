import { memo, useCallback } from "react";
import type { TimerStatus } from "../../types";

export interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export const TimerControls = memo<TimerControlsProps>(
  ({ status, onStart, onPause, onReset, onSkip }) => {
    const handleStart = useCallback(() => {
      onStart();
    }, [onStart]);

    const handlePause = useCallback(() => {
      onPause();
    }, [onPause]);

    const handleReset = useCallback(() => {
      onReset();
    }, [onReset]);

    const handleSkip = useCallback(() => {
      onSkip();
    }, [onSkip]);

    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {status === "running" ? (
          <button
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-glass"
            onClick={handlePause}
          >
            暂停
          </button>
        ) : (
          <button
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-glass"
            onClick={handleStart}
          >
            {status === "paused" ? "继续" : "开始"}
          </button>
        )}
        <button
          className="rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600"
          onClick={handleReset}
        >
          重置
        </button>
        <button
          className="rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600"
          onClick={handleSkip}
        >
          跳过
        </button>
      </div>
    );
  },
);

TimerControls.displayName = "TimerControls";
