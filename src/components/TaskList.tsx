"use client";

/**
 * Компонент TaskList - основной список задач с полным CRUD-функционалом.
 *
 * Основные возможности:
 * - Отображение всех задач из БД с сортировкой по sortOrder
 * - Переключение статуса задачи (todo ↔ done) по клику на иконку
 * - Удаление задач с подтверждением
 * - Редактирование задач через модальное окно (название, описание, приоритет, дедлайн, категория)
 * - Drag & Drop для изменения порядка задач (обновляет sortOrder через batch PUT)
 * - Управление подзадачами через встроенный SubtaskList в модальном окне редактирования
 * - Отображение прогресса подзадач (бейдж с счётчиком)
 *
 * Используется в правой панели главной страницы.
 * Сообщает родительскому компоненту об изменениях через callback onTasksChange.
 */

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, GripVertical, Pencil, CheckSquare } from "lucide-react";
import SubtaskList from "./SubtaskList";

/** Интерфейс подзадачи для отображения счётчика прогресса */
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * Интерфейс задачи со всеми полями для отображения и редактирования.
 * Статус и приоритет используют строковые union-типы для строгой типизации.
 */
interface Task {
  id: string;
  title: string;
  description?: string;
  /** Статус задачи: "todo" - к выполнению, "in_progress" - в процессе, "done" - выполнена */
  status: "todo" | "in_progress" | "done";
  /** Приоритет задачи: "low" - низкий, "medium" - средний, "high" - высокий */
  priority: "low" | "medium" | "high";
  /** Порядок сортировки для drag & drop (0, 1, 2, ...) */
  sortOrder: number;
  /** Дата дедлайна в формате "yyyy-MM-dd" */
  dueDate?: string;
  /** Связанная категория (join из Prisma) */
  category?: {
    id: string;
    name: string;
    color: string;
  };
  /** Массив подзадач для отображения прогресса */
  subtasks?: Subtask[];
}

/** Интерфейс категории для выпадающего списка в форме редактирования */
interface Category {
  id: string;
  name: string;
  color: string;
}

/** Маппинг приоритетов на CSS-классы цветов (фон + текст) */
const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

/** Маппинг приоритетов на русскоязычные метки для UI */
const priorityLabels = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

/** Маппинг статусов на иконки Lucide для визуального различения */
const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

/** Пропсы компонента TaskList */
interface TaskListProps {
  /** Callback для уведомления родителя об изменении задач (триггерит перерисовку Calendar) */
  onTasksChange?: () => void;
}

/**
 * Основной компонент списка задач.
 * Управляет загрузкой, отображением, редактированием и сортировкой задач.
 */
export default function TaskList({ onTasksChange }: TaskListProps) {
  // Массив всех задач из БД
  const [tasks, setTasks] = useState<Task[]>([]);
  // Массив категорий для выпадающего списка в форме редактирования
  const [categories, setCategories] = useState<Category[]>([]);
  // Флаг начальной загрузки (показывает скелетон)
  const [loading, setLoading] = useState(true);
  // Перетаскиваемая задача для drag & drop сортировки
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  // Индекс позиции, над которой находится перетаскиваемая задача (для визуальной подсветки)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Задача, открытая в модальном окне редактирования (null = окно закрыто)
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // Данные формы редактирования (синхронизируются с editingTask при открытии)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    categoryId: "",
  });

  // Загрузка задач и категорий при монтировании компонента
  useEffect(() => {
    loadTasks();
    loadCategories();
  }, []);

  /**
   * Загружает все задачи из API.
   * Задачи возвращаются с включёнными связями (category, subtasks).
   */
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

  /**
   * Загружает список категорий для использования в форме редактирования.
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
   * Обновляет задачу через API (частичное обновление).
   * После успешного обновления заменяет задачу в локальном состоянии
   * и уведомляет родительский компонент через onTasksChange.
   * @param taskId - ID задачи для обновления
   * @param updates - объект с обновляемыми полями
   */
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updatedTask = await response.json();
        // Обновляем задачу в локальном массиве без полной перезагрузки
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
        // Уведомляем родителя для обновления Calendar и других компонентов
        onTasksChange?.();
      }
    } catch (error) {
      console.error("Ошибка при обновлении задачи:", error);
    }
  };

  /**
   * Переключает статус задачи между "done" и "todo".
   * Если задача выполнена - возвращает в "todo", иначе - отмечает как "done".
   */
  const toggleTaskStatus = async (taskId: string, currentStatus: Task["status"]) => {
    const newStatus: Task["status"] = currentStatus === "done" ? "todo" : "done";
    await updateTask(taskId, { status: newStatus });
  };

  /**
   * Удаляет задачу с подтверждением пользователя.
   * Подзадачи удаляются каскадно на уровне БД (onDelete: Cascade в Prisma).
   */
  const deleteTask = async (taskId: string) => {
    if (!confirm("Удалить задачу?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Удаляем задачу из локального состояния
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        onTasksChange?.();
      }
    } catch (error) {
      console.error("Ошибка при удалении задачи:", error);
    }
  };

  // === Модальное окно редактирования ===

  /**
   * Открывает модальное окно редактирования задачи.
   * Заполняет форму текущими данными задачи.
   */
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

  /** Закрывает модальное окно и сбрасывает форму к значениям по умолчанию */
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

  /**
   * Обработчик отправки формы редактирования.
   * Собирает данные из формы, отправляет PUT запрос и закрывает модальное окно.
   * Пустые строки конвертируются в undefined для корректного сохранения.
   */
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    // Формируем объект обновлений, заменяя пустые строки на undefined
    const updates: any = {
      title: editForm.title,
      description: editForm.description || undefined,
      priority: editForm.priority as "low" | "medium" | "high",
      dueDate: editForm.dueDate || undefined,
    };
    // Категорию добавляем только если она выбрана
    if (editForm.categoryId) {
      updates.categoryId = editForm.categoryId;
    }
    await updateTask(editingTask.id, updates);

    closeEditModal();
  };

  // === Обработчики Drag & Drop для сортировки задач ===
  // Используется нативный HTML5 Drag & Drop API для изменения порядка задач в списке

  /**
   * Обработчик начала перетаскивания задачи.
   * Сохраняет задачу в состояние и ID в dataTransfer.
   */
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  /** Обработчик dragOver - разрешает drop и отслеживает позицию для визуальной подсветки */
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  /** Обработчик ухода курсора - убирает подсветку позиции */
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  /**
   * Обработчик drop - перемещает задачу на новую позицию.
   * 1. Вычисляет новый порядок задач в массиве
   * 2. Оптимистично обновляет UI (сразу перерисовывает список)
   * 3. Отправляет batch PUT запросы для обновления sortOrder всех затронутых задач
   */
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedTask) return;

    // Находим текущую позицию перетаскиваемой задачи
    const dragIndex = tasks.findIndex((t) => t.id === draggedTask.id);
    if (dragIndex === dropIndex) return;

    // Перемещаем задачу в массиве: удаляем из старой позиции, вставляем в новую
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(dragIndex, 1);
    newTasks.splice(dropIndex, 0, removed);

    // Обновляем sortOrder для всех задач (индекс = новый sortOrder)
    const reordered = newTasks.map((t, i) => ({ ...t, sortOrder: i }));
    // Оптимистичное обновление UI
    setTasks(reordered);

    // Batch-обновление sortOrder всех задач через параллельные PUT запросы
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

  /** Обработчик завершения перетаскивания - сбрасывает все drag-состояния */
  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverIndex(null);
  };

  // === Состояние загрузки (скелетон) ===
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Задачи</h2>
        </div>
        {/* Скелетон-заглушки для анимации загрузки */}
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
      {/* Заголовок с количеством задач */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Задачи</h2>
        <span className="text-sm text-gray-500">{tasks.length} задач</span>
      </div>

      {/* Прокручиваемый список задач с ограничением по высоте */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {tasks.map((task, index) => {
          // Выбираем иконку статуса: Circle (todo), Clock (in_progress), CheckCircle2 (done)
          const StatusIcon = statusIcons[task.status];
          // Визуальные эффекты для drag & drop
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
                {/* Иконка захвата (grip) и кнопка переключения статуса */}
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <StatusIcon className="w-5 h-5" />
                  </button>
                </div>
                {/* Основное содержимое задачи (кликабельная область для редактирования) */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => openEditModal(task)}
                >
                  {/* Название задачи (зачёркнутое для выполненных) */}
                  <h3 className={`font-medium ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.title}
                  </h3>
                  {/* Описание задачи (обрезается до 2 строк) */}
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {/* Метаинформация: приоритет, категория, подзадачи, дедлайн */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Бейдж приоритета */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    {/* Бейдж категории с цветом из БД (20 = 12% прозрачности для фона) */}
                    {task.category && (
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: task.category.color + "20", color: task.category.color }}
                      >
                        {task.category.name}
                      </span>
                    )}
                    {/* Бейдж прогресса подзадач: зелёный если все выполнены, фиолетовый если нет */}
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
                    {/* Дата дедлайна в формате русской локали */}
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>
                </div>
                {/* Кнопки действий (видны только при наведении на задачу) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {/* Кнопка редактирования */}
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Редактировать"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* Кнопка удаления */}
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

      {/* Заглушка при отсутствии задач */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Нет задач</p>
          <p className="text-sm">Создайте первую задачу!</p>
        </div>
      )}

      {/* Модальное окно редактирования задачи (overlay) */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Редактировать задачу</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Поле ввода названия (обязательное) */}
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
              {/* Поле ввода описания (опциональное) */}
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
              {/* Дедлайн и приоритет в одной строке */}
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

              {/* Кнопки формы: Отмена и Сохранить */}
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
