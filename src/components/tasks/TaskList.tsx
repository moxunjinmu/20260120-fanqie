import { memo, useMemo } from "react";
import { Panel } from "../ui/Panel";
import { TaskFilter, type TaskFilterType } from "./TaskFilter";
import { TaskItem } from "./TaskItem";
import type { Task } from "../../types";

export interface TaskListProps {
  tasks: Task[];
  currentTaskId: string | null;
  filter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
  onSelectTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onOpenForm: () => void;
}

export const TaskList = memo<TaskListProps>(
  ({
    tasks,
    currentTaskId,
    filter,
    onFilterChange,
    onSelectTask,
    onEditTask,
    onDeleteTask,
    onToggleComplete,
    onOpenForm,
  }) => {
    const activeTasksCount = useMemo(
      () => tasks.filter((task) => !task.completed).length,
      [tasks],
    );

    const completedTasksCount = useMemo(
      () => tasks.filter((task) => task.completed).length,
      [tasks],
    );

    const filteredTasks = useMemo(
      () =>
        tasks.filter((task) => {
          if (filter === "active") return !task.completed;
          return task.completed;
        }),
      [tasks, filter],
    );

    const sortedTasks = useMemo(
      () =>
        [...filteredTasks].sort((a, b) => {
          if (filter === "active") {
            return a.createdAt - b.createdAt;
          }
          return b.createdAt - a.createdAt;
        }),
      [filteredTasks, filter],
    );

    return (
      <Panel className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">任务列表</h2>
          <button
            className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-glass transition hover:bg-indigo-700"
            onClick={onOpenForm}
          >
            + 新增任务
          </button>
        </div>

        <TaskFilter
          activeFilter={filter}
          onFilterChange={onFilterChange}
          activeTasksCount={activeTasksCount}
          completedTasksCount={completedTasksCount}
        />

        <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto scrollbar-hidden">
          {sortedTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {filter === "active" ? "暂无待办任务" : "暂无已完成任务"}
            </p>
          ) : (
            sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCurrentTask={currentTaskId === task.id}
                filter={filter}
                onSelect={onSelectTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggle={onToggleComplete}
              />
            ))
          )}
        </div>
      </Panel>
    );
  },
);

TaskList.displayName = "TaskList";
