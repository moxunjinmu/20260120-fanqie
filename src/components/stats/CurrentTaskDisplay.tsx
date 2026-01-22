import { memo } from "react";
import type { Task } from "../../types";

interface CurrentTaskDisplayProps {
  currentTask: Task | null;
  onClearTask: () => void;
}

export const CurrentTaskDisplay = memo<CurrentTaskDisplayProps>(
  ({ currentTask, onClearTask }) => {
    return (
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">当前任务</p>
        {currentTask ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-slate-700">{currentTask.title}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>{currentTask.completedPomodoros}</span>
              <span className="text-slate-300">/</span>
              <span>{currentTask.estPomodoros}</span>
              <button
                className="ml-2 rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-xs text-slate-600 hover:bg-white"
                onClick={onClearTask}
              >
                切换
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">未选择任务</p>
        )}
      </div>
    );
  },
);

CurrentTaskDisplay.displayName = "CurrentTaskDisplay";
