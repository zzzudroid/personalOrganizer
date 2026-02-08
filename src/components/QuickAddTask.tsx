"use client";

/**
 * Компонент QuickAddTask - модальное окно быстрого создания задачи на конкретную дату.
 *
 * Основные возможности:
 * - Создание задачи с автоматически привязанной датой (dueDate)
 * - Упрощённая форма: название, описание, приоритет, категория
 * - Дата задачи устанавливается автоматически из пропса date
 * - Уведомление родителя о создании через callback onTaskCreated
 *
 * Вызывается из DayView при нажатии "Добавить задачу".
 * Отличие от CreateTaskButton: дата задачи предустановлена, нет поля выбора даты.
 * z-index: 70 (поверх DayView с z-index 50).
 */

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

/** Пропсы компонента QuickAddTask */
interface QuickAddTaskProps {
  /** Дата, на которую создаётся задача (автоматически устанавливается как dueDate) */
  date: Date;
  /** Callback для закрытия модального окна */
  onClose: () => void;
  /** Callback при успешном создании задачи (для обновления списка задач) */
  onTaskCreated: () => void;
}

/** Интерфейс категории для выпадающего списка */
interface Category {
  id: string;
  name: string;
  color: string;
}

/**
 * Компонент модального окна быстрого добавления задачи.
 * Принимает дату через пропсы и автоматически привязывает к ней создаваемую задачу.
 */
export default function QuickAddTask({ date, onClose, onTaskCreated }: QuickAddTaskProps) {
  // Флаг отправки формы (блокирует кнопку и показывает "Создание...")
  const [loading, setLoading] = useState(false);
  // Список категорий для выпадающего списка
  const [categories, setCategories] = useState<Category[]>([]);
  // Данные формы (без dueDate - она берётся из пропса date)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    categoryId: "",
  });

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    loadCategories();
  }, []);

  /**
   * Загружает список категорий из API для выпадающего списка.
   */
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

  /**
   * Обработчик отправки формы создания задачи.
   * Дата задачи (dueDate) форматируется из пропса date в "yyyy-MM-dd".
   * При успехе вызывает callback onTaskCreated для обновления DayView.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          status: "todo", // Новые задачи создаются со статусом "todo"
          sortOrder: 0, // Попадает в начало списка
          dueDate: format(date, "yyyy-MM-dd"), // Автоматическая привязка к выбранной дате
          categoryId: formData.categoryId || undefined,
        }),
      });

      if (response.ok) {
        // Уведомляем родителя об успешном создании
        onTaskCreated();
      } else {
        throw new Error("Failed to create task");
      }
    } catch (err) {
      console.error("Ошибка при создании задачи:", err);
      alert("Ошибка при создании задачи");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        {/* Заголовок с датой и кнопкой закрытия */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Новая задача</h2>
            {/* Подзаголовок с указанием даты на русском языке */}
            <p className="text-sm text-gray-500">
              На {format(date, "d MMMM yyyy", { locale: ru })}
            </p>
          </div>
          {/* Кнопка закрытия (крестик) */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле названия задачи (обязательное, автофокус) */}
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

          {/* Поле описания (опциональное) */}
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

          {/* Приоритет и категория в одной строке (grid 2 колонки) */}
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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Кнопки формы: Отмена и Добавить */}
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
