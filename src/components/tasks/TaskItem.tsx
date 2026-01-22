import { memo } from "react";
import type { Task } from "../../types";
import type { TaskFilterType } from "./TaskFilter";

export interface TaskItemProps {
  task: Task;
  isCurrentTask: boolean;
  filter: TaskFilterType;
  onSelect: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onToggle: (taskId: string) => void;
}

export const TaskItem = memo<TaskItemProps>(
  ({ task, isCurrentTask, filter, onSelect, onEdit, onDelete, onToggle }) => {
    return (
      <div
        className={`group rounded-xl border p-3 transition ${
          isCurrentTask
            ? "border-indigo-300 bg-indigo-50/50"
            : "border-white/60 bg-white/60 hover:border-slate-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p
              className={`text-sm font-medium ${
                task.completed ? "text-slate-400 line-through" : "text-slate-700"
              }`}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>
                {task.completedPomodoros}/{task.estPomodoros}
              </span>
              <span className="text-slate-300">|</span>
              <span>🍅 x {task.estPomodoros}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {filter === "active" && (
              <>
                <button
                  className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-white hover:text-indigo-600 group-hover:opacity-100"
                  onClick={() => onEdit(task.id)}
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-white hover:text-red-500 group-hover:opacity-100"
                  onClick={() => onDelete(task.id)}
                  title="删除"
                >
                  🗑️
                </button>
              </>
            )}
            {filter === "completed" && (
              <button
                className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-white hover:text-amber-500 group-hover:opacity-100"
                onClick={() => onToggle(task.id)}
                title="恢复为待办"
              >
                ↩️
              </button>
            )}
          </div>
        </div>
        {filter === "active" && (
          <button
            className={`mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              isCurrentTask
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white/80 text-slate-600 hover:bg-white"
            }`}
            onClick={() => onSelect(task.id)}
          >
            {isCurrentTask ? "当前任务" : "选择此任务"}
          </button>
        )}
      </div>
    );
  },
);

TaskItem.displayName = "TaskItem";
