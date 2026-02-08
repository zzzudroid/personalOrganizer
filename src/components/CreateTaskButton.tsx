"use client";

/**
 * Компонент CreateTaskButton - кнопка создания новой задачи с модальной формой.
 *
 * Основные возможности:
 * - Кнопка "Новая задача" для вызова модального окна
 * - Модальная форма создания задачи со всеми полями:
 *   название (обязательное), описание, дедлайн, приоритет, категория
 * - Загрузка списка категорий при открытии формы
 * - Перезагрузка страницы после успешного создания (window.location.reload)
 *
 * Используется в шапке главной страницы.
 * После создания задачи делает полный reload страницы вместо callback-уведомления.
 */

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

/** Интерфейс категории для выпадающего списка в форме создания */
interface Category {
  id: string;
  name: string;
  color: string;
}

/**
 * Компонент кнопки создания задачи с модальной формой.
 * Не принимает пропсов - самодостаточный компонент.
 */
export default function CreateTaskButton() {
  // Флаг открытия модального окна
  const [isOpen, setIsOpen] = useState(false);
  // Флаг отправки формы (блокирует кнопку "Создать" и показывает "Создание...")
  const [loading, setLoading] = useState(false);
  // Список категорий, загружаемый при открытии формы
  const [categories, setCategories] = useState<Category[]>([]);
  // Данные формы создания задачи
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    categoryId: "",
  });

  // Загрузка категорий при открытии модального окна
  // (не при монтировании, а по требованию - для оптимизации)
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

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
   * Отправляет POST запрос на /api/tasks с данными формы.
   * При успехе закрывает модальное окно, сбрасывает форму и перезагружает страницу.
   * Пустые строки конвертируются в undefined для корректного сохранения в БД.
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
          status: "todo", // Новые задачи всегда создаются со статусом "todo"
          sortOrder: 0, // Новая задача попадает в начало списка
          dueDate: formData.dueDate || undefined,
          categoryId: formData.categoryId || undefined,
        }),
      });

      if (response.ok) {
        // Закрываем модальное окно
        setIsOpen(false);
        // Сбрасываем форму к значениям по умолчанию
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          categoryId: "",
        });
        // Полная перезагрузка страницы для обновления всех компонентов
        window.location.reload();
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
    <>
      {/* Кнопка открытия модального окна создания задачи */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Новая задача
      </button>

      {/* Модальное окно создания задачи (overlay) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Новая задача</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Поле названия задачи (обязательное) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название задачи"
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
                  rows={3}
                  placeholder="Описание задачи"
                />
              </div>
              {/* Дедлайн и приоритет в одной строке (grid 2 колонки) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дедлайн
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
              </div>
              {/* Выбор категории из выпадающего списка */}
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
              {/* Кнопки формы: Отмена и Создать */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
