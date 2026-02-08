"use client";

/**
 * Компонент DayView - полноэкранное модальное окно с задачами конкретного дня.
 *
 * Основные возможности:
 * - Полноэкранное отображение задач выбранного дня
 * - Переключение статуса задач (todo ↔ done)
 * - Удаление задач с подтверждением
 * - Редактирование задач через вложенное модальное окно
 * - Drag & Drop для изменения порядка задач внутри дня
 * - Управление подзадачами через SubtaskList в модальном окне редактирования
 * - Отображение прогресса выполнения (N из M выполнено)
 * - Кнопка быстрого добавления задачи на этот день
 *
 * Открывается по клику на день в Calendar.
 * z-index: 50 (основной вид), 60 (вложенное модальное окно редактирования).
 */

import { useState, useEffect } from "react";
import { ChevronLeft, Plus, X, Calendar as CalendarIcon, GripVertical, Pencil, CheckSquare } from "lucide-react";
import { format, isSameDay, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import SubtaskList from "./SubtaskList";

/** Интерфейс подзадачи для отображения счётчика прогресса */
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * Интерфейс задачи со всеми полями для отображения и редактирования.
 * Отличается от интерфейса в TaskList: status и priority используют string
 * (вместо union-типов) для совместимости с API-ответом.
 */
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  /** Порядок сортировки для drag & drop внутри дня */
  sortOrder: number;
  /** Дата в формате "yyyy-MM-dd" */
  dueDate?: string;
  /** Связанная категория с цветом */
  category?: {
    id: string;
    name: string;
    color: string;
  };
  /** Подзадачи для индикатора прогресса */
  subtasks?: Subtask[];
}

/** Интерфейс категории для выпадающего списка */
interface Category {
  id: string;
  name: string;
  color: string;
}

/** Пропсы компонента DayView */
interface DayViewProps {
  /** Выбранная дата для отображения задач */
  date: Date;
  /** Callback для закрытия DayView (возврат к Calendar) */
  onClose: () => void;
  /** Callback для открытия формы быстрого добавления задачи (QuickAddTask) */
  onAddTask?: (date: Date) => void;
  /** Callback для уведомления родителя об изменении задач */
  onTaskChange?: () => void;
}

/** Маппинг приоритетов на CSS-классы (фон, текст, граница) */
const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

/** Маппинг приоритетов на русскоязычные метки */
const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

/**
 * Компонент полноэкранного просмотра задач дня.
 * Занимает весь экран (fixed inset-0) и отображает задачи выбранной даты.
 */
export default function DayView({ date, onClose, onAddTask, onTaskChange }: DayViewProps) {
  // Задачи, отфильтрованные по выбранной дате
  const [tasks, setTasks] = useState<Task[]>([]);
  // Категории для формы редактирования
  const [categories, setCategories] = useState<Category[]>([]);
  // Флаг начальной загрузки
  const [loading, setLoading] = useState(true);
  // Перетаскиваемая задача для drag & drop сортировки
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  // Индекс позиции для визуальной подсветки при drag & drop
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Задача, открытая для редактирования (null = модальное окно закрыто)
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // Данные формы редактирования
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    categoryId: "",
  });

  // Перезагрузка задач и категорий при изменении выбранной даты
  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [date]);

  /**
   * Загружает задачи из API и фильтрует по выбранной дате.
   * Загружаются все задачи, затем фильтруются на клиенте с помощью isSameDay.
   * Результат сортируется по sortOrder для сохранения пользовательского порядка.
   */
  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const allTasks = await response.json();
        // Фильтрация задач по выбранному дню
        const dayTasks = allTasks.filter((task: Task) => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          return isSameDay(taskDate, date);
        });
        // Сортировка по sortOrder для правильного порядка отображения
        setTasks(dayTasks.sort((a: Task, b: Task) => a.sortOrder - b.sortOrder));
      }
    } catch (err) {
      console.error("Ошибка при загрузке задач:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Загружает список категорий для выпадающего списка в форме редактирования.
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
   * Переключает статус задачи между "done" и "todo".
   * После успешного обновления перезагружает список задач
   * и уведомляет родителя для обновления Calendar.
   */
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
        onTaskChange?.();
      }
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
    }
  };

  /**
   * Удаляет задачу с подтверждением через confirm().
   * Подзадачи удаляются каскадно (Prisma onDelete: Cascade).
   */
  const deleteTask = async (taskId: string) => {
    if (!confirm("Удалить задачу?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        loadTasks();
        onTaskChange?.();
      }
    } catch (err) {
      console.error("Ошибка при удалении задачи:", err);
    }
  };

  // === Модальное окно редактирования ===

  /**
   * Открывает вложенное модальное окно редактирования задачи.
   * Заполняет форму текущими значениями задачи.
   */
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      categoryId: task.category?.id || "",
    });
  };

  /** Закрывает модальное окно редактирования и сбрасывает форму */
  const closeEditModal = () => {
    setEditingTask(null);
    setEditForm({
      title: "",
      description: "",
      priority: "medium",
      categoryId: "",
    });
  };

  /**
   * Обработчик отправки формы редактирования.
   * Отправляет PUT запрос с обновлёнными данными.
   * Категория добавляется в обновление только если выбрана.
   */
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      // Формируем объект обновлений
      const updates: any = {
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
      };
      // Категорию включаем только при наличии выбора
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
        // Уведомляем родителя для синхронизации Calendar
        onTaskChange?.();
      }
    } catch (err) {
      console.error("Ошибка при редактировании задачи:", err);
    }
  };

  // === Обработчики Drag & Drop для сортировки задач внутри дня ===

  /**
   * Обработчик начала перетаскивания задачи.
   * Сохраняет ссылку на задачу и устанавливает эффект перемещения.
   */
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  /** Обработчик dragOver - разрешает drop и отслеживает позицию */
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  /** Сбрасывает подсветку при уходе курсора */
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  /**
   * Обработчик drop - перемещает задачу на новую позицию.
   * Аналогичен логике в TaskList: splice + batch PUT для sortOrder.
   */
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedTask) return;

    const dragIndex = tasks.findIndex((t) => t.id === draggedTask.id);
    if (dragIndex === dropIndex) return;

    // Перемещение элемента в массиве
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(dragIndex, 1);
    newTasks.splice(dropIndex, 0, removed);

    // Пересчёт sortOrder и оптимистичное обновление UI
    const reordered = newTasks.map((t, i) => ({ ...t, sortOrder: i }));
    setTasks(reordered);

    // Batch-обновление sortOrder через параллельные PUT запросы
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

  // Подсчёт выполненных задач для индикатора прогресса в шапке
  const completedCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Шапка с навигацией, датой и кнопкой добавления */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          {/* Кнопка "Назад" - возврат к Calendar */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Назад</span>
          </button>
          {/* Разделитель */}
          <div className="h-6 w-px bg-gray-300"></div>
          {/* Информация о дне: название + полная дата */}
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
          {/* Счётчик выполненных задач */}
          <div className="text-sm text-gray-500">
            {completedCount} из {tasks.length} выполнено
          </div>
          {/* Кнопка добавления новой задачи на этот день */}
          <button
            onClick={() => onAddTask?.(date)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить
          </button>
        </div>
      </header>

      {/* Основное содержимое: список задач */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            /* Скелетон-заглушки при загрузке */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            /* Заглушка при отсутствии задач на этот день */
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
            /* Список задач с поддержкой drag & drop */
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
                      {/* Иконка захвата для перетаскивания */}
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing mt-0.5" />

                      {/* Кнопка переключения статуса (чекбокс) */}
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
                        {/* Галочка для выполненных задач */}
                        {task.status === "done" && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Содержимое задачи */}
                      <div className="flex-1 min-w-0">
                        {/* Название (зачёркнутое для выполненных) */}
                        <h3
                          className={`font-medium text-lg ${
                            task.status === "done" ? "line-through text-gray-400" : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </h3>
                        {/* Описание задачи */}
                        {task.description && (
                          <p className="text-gray-600 mt-1">{task.description}</p>
                        )}
                        {/* Метаинформация: приоритет, категория, подзадачи */}
                        <div className="flex items-center gap-3 mt-3">
                          {/* Бейдж приоритета */}
                          <span className="text-xs px-2 py-1 rounded border bg-white">
                            {priorityLabels[task.priority]}
                          </span>
                          {/* Бейдж категории с цветом */}
                          {task.category && (
                            <span
                              className="text-xs px-2 py-1 rounded text-white"
                              style={{ backgroundColor: task.category.color }}
                            >
                              {task.category.name}
                            </span>
                          )}
                          {/* Индикатор прогресса подзадач */}
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

                      {/* Кнопки действий (видимы при наведении) */}
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

      {/* Вложенное модальное окно редактирования задачи (z-index: 60) */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Редактировать задачу</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Поле названия (обязательное) */}
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
              {/* Поле описания */}
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
              {/* Выбор приоритета */}
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
              {/* Выбор категории */}
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

              {/* Встроенный компонент управления подзадачами */}
              {editingTask && <SubtaskList taskId={editingTask.id} />}

              {/* Кнопки формы */}
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
