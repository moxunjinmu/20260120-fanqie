import { memo } from "react";
import { formatSeconds } from "../../lib/time";
import { TIMER_RADIUS, TIMER_CIRCUMFERENCE } from "../../constants/timer";

export interface TimerCircleProps {
  remainingSeconds: number;
  totalSeconds: number;
}

export const TimerCircle = memo<TimerCircleProps>(({ remainingSeconds, totalSeconds }) => {
  const progressRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - progressRatio);

  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <svg className="h-full w-full progress-ring" viewBox="0 0 220 220">
        <circle
          cx="110"
          cy="110"
          r={TIMER_RADIUS}
          fill="none"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth="14"
        />
        <circle
          cx="110"
          cy="110"
          r={TIMER_RADIUS}
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={TIMER_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
        />
        <defs>
          <linearGradient id="timerGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-semibold text-slate-900 text-shadow-soft">
          {formatSeconds(remainingSeconds)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
          {Math.ceil(remainingSeconds / 60)} min left
        </p>
      </div>
    </div>
  );
});

TimerCircle.displayName = "TimerCircle";
