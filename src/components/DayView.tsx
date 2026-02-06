"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Plus, X, Calendar as CalendarIcon, GripVertical, Pencil, CheckSquare } from "lucide-react";
import { format, isSameDay, isToday } from "date-fns";
import { ru } from "date-fns/locale";
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
  status: string;
  priority: string;
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

interface DayViewProps {
  date: Date;
  onClose: () => void;
  onAddTask?: (date: Date) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export default function DayView({ date, onClose, onAddTask }: DayViewProps) {
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
    categoryId: "",
  });

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [date]);

  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const allTasks = await response.json();
        const dayTasks = allTasks.filter((task: Task) => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          return isSameDay(taskDate, date);
        });
        setTasks(dayTasks.sort((a: Task, b: Task) => a.sortOrder - b.sortOrder));
      }
    } catch (err) {
      console.error("Ошибка при загрузке задач:", err);
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

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "done" ? "todo" : "done";
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        loadTasks();
      }
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Удалить задачу?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        loadTasks();
      }
    } catch (err) {
      console.error("Ошибка при удалении задачи:", err);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      categoryId: task.category?.id || "",
    });
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditForm({
      title: "",
      description: "",
      priority: "medium",
      categoryId: "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const updates: any = {
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
      };
      if (editForm.categoryId) {
        updates.categoryId = editForm.categoryId;
      }

      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        loadTasks();
        closeEditModal();
      }
    } catch (err) {
      console.error("Ошибка при редактировании задачи:", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
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

  const completedCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Назад</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isToday(date) ? "Сегодня" : format(date, "EEEE", { locale: ru })}
            </h1>
            <p className="text-gray-500">
              {format(date, "d MMMM yyyy", { locale: ru })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {completedCount} из {tasks.length} выполнено
          </div>
          <button
            onClick={() => onAddTask?.(date)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Нет задач на этот день
              </h3>
              <p className="text-gray-500 mb-6">
                Добавьте задачу, чтобы начать планировать свой день
              </p>
              <button
                onClick={() => onAddTask?.(date)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                Добавить задачу
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => {
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
                    className={`
                      p-4 border rounded-lg transition-all group cursor-move
                      ${isDragged ? "opacity-50 rotate-1 scale-95" : "opacity-100"}
                      ${isDragOver ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "hover:shadow-md"}
                      ${task.status === "done" ? "bg-gray-50" : "bg-white"}
                      ${priorityColors[task.priority]}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing mt-0.5" />
                      
                      <button
                        onClick={() => toggleTaskStatus(task.id, task.status)}
                        className={`
                          mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                          ${task.status === "done"
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-blue-500"
                          }
                        `}
                      >
                        {task.status === "done" && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-lg ${
                            task.status === "done" ? "line-through text-gray-400" : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs px-2 py-1 rounded border bg-white">
                            {priorityLabels[task.priority]}
                          </span>
                          {task.category && (
                            <span
                              className="text-xs px-2 py-1 rounded text-white"
                              style={{ backgroundColor: task.category.color }}
                            >
                              {task.category.name}
                            </span>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                              task.subtasks.every(s => s.completed)
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-purple-100 text-purple-700 border border-purple-300"
                            }`}>
                              <CheckSquare className="w-3 h-3" />
                              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Удалить"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
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
