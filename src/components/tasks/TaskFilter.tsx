import { memo } from "react";

export type TaskFilterType = "active" | "completed";

export interface TaskFilterProps {
  activeFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
  activeTasksCount: number;
  completedTasksCount: number;
}

export const TaskFilter = memo<TaskFilterProps>(
  ({ activeFilter, onFilterChange, activeTasksCount, completedTasksCount }) => {
    return (
      <div className="flex gap-2 rounded-lg bg-white/60 p-1">
        <button
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            activeFilter === "active" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"
          }`}
          onClick={() => onFilterChange("active")}
        >
          待办 ({activeTasksCount})
        </button>
        <button
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            activeFilter === "completed" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"
          }`}
          onClick={() => onFilterChange("completed")}
        >
          已完成 ({completedTasksCount})
        </button>
      </div>
    );
  },
);

TaskFilter.displayName = "TaskFilter";
