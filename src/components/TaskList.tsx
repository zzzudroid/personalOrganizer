"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, GripVertical, Pencil, CheckSquare } from "lucide-react";
import SubtaskList from "./SubtaskList";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  sortOrder: number;
  dueDate?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  subtasks?: Subtask[];
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const priorityLabels = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    categoryId: "",
  });

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Ошибка при загрузке задач:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Ошибка при загрузке категорий:", error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
      }
    } catch (error) {
      console.error("Ошибка при обновлении задачи:", error);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: Task["status"]) => {
    const newStatus: Task["status"] = currentStatus === "done" ? "todo" : "done";
    await updateTask(taskId, { status: newStatus });
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Удалить задачу?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Ошибка при удалении задачи:", error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate || "",
      categoryId: task.category?.id || "",
    });
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditForm({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      categoryId: "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const updates: any = {
      title: editForm.title,
      description: editForm.description || undefined,
      priority: editForm.priority as "low" | "medium" | "high",
      dueDate: editForm.dueDate || undefined,
    };
    if (editForm.categoryId) {
      updates.categoryId = editForm.categoryId;
    }
    await updateTask(editingTask.id, updates);

    closeEditModal();
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedTask) return;

    const dragIndex = tasks.findIndex((t) => t.id === draggedTask.id);
    if (dragIndex === dropIndex) return;

    const newTasks = [...tasks];
    const [removed] = newTasks.splice(dragIndex, 1);
    newTasks.splice(dropIndex, 0, removed);

    const reordered = newTasks.map((t, i) => ({ ...t, sortOrder: i }));
    setTasks(reordered);

    try {
      await Promise.all(
        reordered.map((task, index) =>
          fetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: index }),
          })
        )
      );
    } catch (error) {
      console.error("Ошибка при сохранении порядка:", error);
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Задачи</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Задачи</h2>
        <span className="text-sm text-gray-500">{tasks.length} задач</span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {tasks.map((task, index) => {
          const StatusIcon = statusIcons[task.status];
          const isDragged = draggedTask?.id === task.id;
          const isDragOver = dragOverIndex === index;
          
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                p-4 border rounded-lg transition-all duration-200 group
                ${isDragged ? "opacity-50 rotate-2 scale-95" : "opacity-100"}
                ${isDragOver ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "hover:shadow-md"}
                ${task.status === "done" ? "bg-gray-50" : "bg-white"}
                cursor-move
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <StatusIcon className="w-5 h-5" />
                  </button>
                </div>
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => openEditModal(task)}
                >
                  <h3 className={`font-medium ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    {task.category && (
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: task.category.color + "20", color: task.category.color }}
                      >
                        {task.category.name}
                      </span>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                        task.subtasks.every(s => s.completed) 
                          ? "bg-green-100 text-green-700" 
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        <CheckSquare className="w-3 h-3" />
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Редактировать"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-all text-xl"
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Нет задач</p>
          <p className="text-sm">Создайте первую задачу!</p>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Редактировать задачу</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дедлайн
                  </label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория
                </label>
                <select
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Без категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Подзадачи */}
              {editingTask && <SubtaskList taskId={editingTask.id} />}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
