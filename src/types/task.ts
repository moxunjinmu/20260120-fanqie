export interface Task {
  id: string;
  title: string;
  estPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  createdAt: number;
}

export type TaskFilter = "active" | "completed";

export interface TaskFormState {
  isOpen: boolean;
  editingTaskId: string | null;
  title: string;
  estPomodoros: number;
}
