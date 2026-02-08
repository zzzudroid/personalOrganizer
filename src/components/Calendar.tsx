"use client";

/**
 * Компонент Calendar - интерактивный календарь с отображением задач.
 *
 * Основные возможности:
 * - Отображение месячного календаря с навигацией по месяцам
 * - Визуализация задач на соответствующих днях
 * - Drag & Drop для перемещения задач между днями (изменение dueDate)
 * - Клик по дню открывает DayView (через callback onDateSelect)
 * - Отображение индикатора подзадач (галочка/квадрат)
 * - Ограничение показа до 3 задач в ячейке с индикатором "+N ещё"
 *
 * Используется на главной странице как основной навигационный элемент.
 * Данные загружаются из PostgreSQL через API /api/tasks.
 */

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Move } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  getDate,
  isSameDay,
} from "date-fns";
import { ru } from "date-fns/locale";

/** Интерфейс подзадачи для отображения индикатора прогресса в ячейке календаря */
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

/** Интерфейс задачи с основными полями для отображения в календаре */
interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  /** Дата в формате "yyyy-MM-dd" (строка, не Date) для упрощения сравнения */
  dueDate?: string;
  /** Связанная категория с цветом для визуального различения */
  category?: {
    name: string;
    color: string;
  };
  /** Массив подзадач для индикатора прогресса */
  subtasks?: Subtask[];
}

/** Пропсы компонента Calendar */
interface CalendarProps {
  /** Callback при клике на день - открывает DayView */
  onDateSelect?: (date: Date) => void;
}

/**
 * Форматирует объект Date в строку "yyyy-MM-dd" для хранения в БД.
 * Этот формат совпадает с форматом dueDate в модели Task (Prisma).
 * @param date - объект Date для конвертации
 * @returns строка в формате "yyyy-MM-dd"
 */
const formatDateForStorage = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

/**
 * Основной компонент календаря.
 * Рендерит сетку дней текущего месяца с задачами и поддержкой drag & drop.
 */
export default function Calendar({ onDateSelect }: CalendarProps) {
  // Текущий отображаемый месяц (навигация стрелками влево/вправо)
  const [currentDate, setCurrentDate] = useState(new Date());
  // Все задачи, загруженные из API (фильтруются по дням при отображении)
  const [tasks, setTasks] = useState<Task[]>([]);
  // ID перетаскиваемой задачи (для визуального эффекта прозрачности)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  // День, над которым находится перетаскиваемая задача (для подсветки ячейки)
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);

  // Загрузка задач при монтировании компонента
  useEffect(() => {
    loadTasks();
  }, []);

  /**
   * Загружает все задачи из API.
   * Фильтрация по конкретным дням происходит в getTasksForDay.
   */
  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Ошибка при загрузке задач:", err);
    }
  };

  // === Вычисление диапазона дней для отображения в сетке ===
  // Начало и конец текущего месяца
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  // Расширяем диапазон до полных недель (Пн-Вс), чтобы сетка была прямоугольной
  // weekStartsOn: 1 означает, что неделя начинается с понедельника
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  // Массив всех дней для отображения (обычно 35 или 42 дня)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Названия дней недели на русском языке
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  /**
   * Возвращает задачи, привязанные к конкретному дню.
   * Сравнение идёт по строковому формату "yyyy-MM-dd" для избежания проблем с timezone.
   * @param day - день для фильтрации
   * @returns массив задач на указанный день
   */
  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate === formatDateForStorage(day);
    });
  };

  // === Обработчики Drag & Drop ===
  // Используется нативный HTML5 Drag & Drop API для перемещения задач между днями

  /**
   * Обработчик события dragOver - разрешает drop на ячейку дня.
   * Устанавливает визуальную подсветку ячейки-приёмника.
   */
  const handleDragOver = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(day);
  };

  /** Обработчик ухода курсора с ячейки - убирает подсветку */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDay(null);
  };

  /**
   * Обработчик drop - перемещает задачу на новый день.
   * Отправляет PUT запрос на API для обновления dueDate задачи.
   * После успешного обновления перезагружает все задачи.
   */
  const handleDrop = async (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(null);

    // Извлекаем ID задачи, установленный при dragStart
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    try {
      // Обновляем дату задачи через API
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: formatDateForStorage(day) }),
      });

      if (response.ok) {
        // Перезагружаем все задачи для обновления отображения
        loadTasks();
      }
    } catch (error) {
      console.error("Ошибка при перемещении задачи:", error);
    }
  };

  /**
   * Обработчик начала перетаскивания задачи.
   * Сохраняет ID задачи в dataTransfer для последующего использования в handleDrop.
   */
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  /** Обработчик завершения перетаскивания - сбрасывает визуальные состояния */
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverDay(null);
  };

  // === Навигация по месяцам ===
  /** Переключение на предыдущий месяц */
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  /** Переключение на следующий месяц */
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Шапка календаря: навигация по месяцам и подсказка о drag & drop */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          {/* Кнопка "Предыдущий месяц" */}
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          {/* Название текущего месяца и год на русском языке */}
          <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
            {format(currentDate, "LLLL yyyy", { locale: ru })}
          </h2>
          {/* Кнопка "Следующий месяц" */}
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Подсказка пользователю о возможности перетаскивания */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Move className="w-4 h-4" />
          <span>Перетаскивайте задачи</span>
        </div>
      </div>

      {/* Сетка календаря */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {/* Заголовки дней недели (Пн-Вс) */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}

          {/* Ячейки дней календаря */}
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            // Проверяем, является ли текущая ячейка целью для drop
            const isDragOver = dragOverDay && isSameDay(dragOverDay, day);

            return (
              <div
                key={day.toISOString()}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                onClick={() => onDateSelect?.(day)}
                className={`
                  bg-white min-h-[100px] p-2 cursor-pointer transition-colors
                  ${!isSameMonth(day, currentDate) ? "bg-gray-50 text-gray-400" : ""}
                  ${isToday(day) ? "bg-blue-50" : ""}
                  ${isDragOver ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" : "hover:bg-gray-50"}
                `}
              >
                {/* Число дня с круглым индикатором для "сегодня" */}
                <div className={`
                  text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday(day) ? "bg-blue-600 text-white" : "text-gray-700"}
                `}>
                  {getDate(day)}
                </div>

                {/* Список задач на этот день (максимум 3 видимых) */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`
                        text-xs px-2 py-1 rounded truncate cursor-move flex items-center gap-1
                        ${task.status === "done" ? "bg-gray-100 line-through text-gray-400" : "bg-blue-100 text-blue-800"}
                        ${draggedTaskId === task.id ? "opacity-50" : ""}
                      `}
                    >
                      {/* Индикатор подзадач: галочка если все выполнены, квадрат если нет */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="text-[10px]">
                          {task.subtasks.filter(s => s.completed).length === task.subtasks.length ? "✓" : "☐"}
                        </span>
                      )}
                      {task.title}
                    </div>
                  ))}
                  {/* Индикатор количества скрытых задач, если их больше 3 */}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayTasks.length - 3} ещё
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
