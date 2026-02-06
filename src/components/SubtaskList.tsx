"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

interface SubtaskListProps {
  taskId: string;
}

export default function SubtaskList({ taskId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [draggedSubtask, setDraggedSubtask] = useState<Subtask | null>(null);

  useEffect(() => {
    loadSubtasks();
  }, [taskId]);

  const loadSubtasks = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`);
      if (response.ok) {
        const data = await response.json();
        setSubtasks(data);
      }
    } catch (error) {
      console.error("Ошибка при загрузке подзадач:", error);
    }
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtaskTitle,
          sortOrder: subtasks.length,
        }),
      });

      if (response.ok) {
        setNewSubtaskTitle("");
        loadSubtasks();
      }
    } catch (error) {
      console.error("Ошибка при создании подзадачи:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtask = async (subtask: Subtask) => {
    try {
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !subtask.completed,
        }),
      });

      if (response.ok) {
        loadSubtasks();
      }
    } catch (error) {
      console.error("Ошибка при обновлении подзадачи:", error);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadSubtasks();
      }
    } catch (error) {
      console.error("Ошибка при удалении подзадачи:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, subtask: Subtask) => {
    setDraggedSubtask(subtask);
    e.dataTransfer.setData("subtaskId", subtask.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedSubtask) return;

    const dragIndex = subtasks.findIndex((s) => s.id === draggedSubtask.id);
    if (dragIndex === dropIndex) return;

    const newSubtasks = [...subtasks];
    const [removed] = newSubtasks.splice(dragIndex, 1);
    newSubtasks.splice(dropIndex, 0, removed);

    const reordered = newSubtasks.map((s, i) => ({ ...s, sortOrder: i }));
    setSubtasks(reordered);

    try {
      await Promise.all(
        reordered.map((subtask, index) =>
          fetch(`/api/subtasks/${subtask.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: index }),
          })
        )
      );
    } catch (error) {
      console.error("Ошибка при сохранении порядка:", error);
    }

    setDraggedSubtask(null);
  };

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Подзадачи</h4>
        <span className="text-xs text-gray-500">
          {completedCount} из {subtasks.length}
        </span>
      </div>

      {/* Прогресс-бар */}
      {subtasks.length > 0 && (
        <div className="mb-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Список подзадач */}
      <div className="space-y-2 mb-3">
        {subtasks.map((subtask, index) => (
          <div
            key={subtask.id}
            draggable
            onDragStart={(e) => handleDragStart(e, subtask)}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-2 p-2 bg-gray-50 rounded-lg group cursor-move ${
              subtask.completed ? "opacity-60" : ""
            }`}
          >
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
            
            <button
              onClick={() => toggleSubtask(subtask)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                subtask.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 hover:border-blue-500"
              }`}
            >
              {subtask.completed && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <span
              className={`flex-1 text-sm ${
                subtask.completed ? "line-through text-gray-400" : "text-gray-700"
              }`}
            >
              {subtask.title}
            </span>

            <button
              onClick={() => deleteSubtask(subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Добавление подзадачи */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addSubtask()}
          placeholder="Новая подзадача..."
          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={addSubtask}
          disabled={loading || !newSubtaskTitle.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
