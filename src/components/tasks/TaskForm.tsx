import { memo, useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { Task } from "../../types";

export interface TaskFormProps {
  isOpen: boolean;
  editingTask: Task | null;
  onSave: (title: string, estPomodoros: number) => void;
  onClose: () => void;
}

export const TaskForm = memo<TaskFormProps>(({ isOpen, editingTask, onSave, onClose }) => {
  const [title, setTitle] = useState("");
  const [estPomodoros, setEstPomodoros] = useState(1);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setEstPomodoros(editingTask.estPomodoros);
    } else {
      setTitle("");
      setEstPomodoros(1);
    }
  }, [editingTask, isOpen]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave(trimmedTitle, estPomodoros);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSave();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-semibold text-slate-900">
        {editingTask ? "编辑任务" : "新增任务"}
      </h3>
      <div className="mt-4 grid gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">任务名称</label>
          <Input
            variant="full"
            className="mt-1.5"
            type="text"
            placeholder="输入任务名称..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">预估番茄数</label>
          <Input
            variant="full"
            className="mt-1.5"
            type="number"
            min={1}
            max={20}
            value={estPomodoros}
            onChange={(event) =>
              setEstPomodoros(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
            }
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSave}>
          保存
        </Button>
      </div>
    </Modal>
  );
});

TaskForm.displayName = "TaskForm";
