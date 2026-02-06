"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface QuickAddTaskProps {
  date: Date;
  onClose: () => void;
  onTaskCreated: () => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  order: number;
  dueDate?: string;
  categoryId?: string;
  category?: Category;
}

const CATEGORIES: Category[] = [
  { id: "1", name: "Работа", color: "#3b82f6" },
  { id: "2", name: "Личное", color: "#10b981" },
  { id: "3", name: "Учеба", color: "#f59e0b" },
  { id: "4", name: "Здоровье", color: "#ef4444" },
];

const STORAGE_KEY = "personal-organizer-tasks";

export default function QuickAddTask({ date, onClose, onTaskCreated }: QuickAddTaskProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    categoryId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const tasks: Task[] = stored ? JSON.parse(stored) : [];
      
      // Создаем задачу с выбранной датой
      const newTask: Task = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority as "low" | "medium" | "high",
        status: "todo",
        order: tasks.length,
        dueDate: format(date, "yyyy-MM-dd"),
        categoryId: formData.categoryId || undefined,
      };

      // Добавляем категорию
      if (formData.categoryId) {
        const category = CATEGORIES.find((c) => c.id === formData.categoryId);
        if (category) {
          newTask.category = category;
        }
      }

      // Сохраняем
      const updatedTasks = [...tasks, newTask];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));

      // Триггерим событие для обновления других компонентов
      window.dispatchEvent(new Event("storage"));

      onTaskCreated();
    } catch (err) {
      console.error("Failed to create task", err);
      alert("Ошибка при создании задачи");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Новая задача</h2>
            <p className="text-sm text-gray-500">
              На {format(date, "d MMMM yyyy", { locale: ru })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Что нужно сделать?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Дополнительные детали..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Без категории</option>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Создание..." : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
