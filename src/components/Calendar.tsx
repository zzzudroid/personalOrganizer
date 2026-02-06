"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Menu, Search, Settings, HelpCircle, Move } from "lucide-react";
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

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  category?: {
    name: string;
    color: string;
  };
}

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
}

const STORAGE_KEY = "personal-organizer-tasks";

// Форматируем дату в YYYY-MM-DD без timezone issues
const formatDateForStorage = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export default function Calendar({ onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);

  useEffect(() => {
    loadTasks();
    const handleStorageChange = () => loadTasks();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loadTasks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load tasks");
    }
  };

  const saveTasks = (newTasks: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    setTasks(newTasks);
    // Триггерим событие для обновления других компонентов
    window.dispatchEvent(new Event("storage"));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      // Сравниваем строки дат напрямую
      return task.dueDate === formatDateForStorage(day);
    });
  };

  const handleDragOver = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(day);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(null);

    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) {
      console.log("No taskId in drop data");
      return;
    }

    console.log("Dropping task", taskId, "on day", formatDateForStorage(day));

    // Обновляем dueDate задачи
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          dueDate: formatDateForStorage(day),
        };
      }
      return task;
    });

    saveTasks(updatedTasks);
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation();
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDayClick = (day: Date) => {
    // Не открываем day view если был drag
    if (draggedTaskId) {
      setDraggedTaskId(null);
      return;
    }
    onDateSelect?.(day);
  };

  const handleToday = () => setCurrentDate(new Date());
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center px-4 py-2 border-b bg-white">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-full mr-2"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToday}
            className="px-4 py-1.5 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Сегодня
          </button>

          <div className="flex items-center">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <h1 className="text-xl font-normal text-gray-800 capitalize">
            {format(currentDate, "LLLL yyyy", { locale: ru })}
          </h1>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mr-4">
            <Move className="w-4 h-4" />
            <span>Перетаскивайте задачи</span>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`py-2 text-center text-sm font-medium text-gray-600 ${
                index >= 5 ? "text-gray-400" : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5">
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dayTasks = getTasksForDay(day);
            const isWeekend = index % 7 >= 5;
            const isDragOver = dragOverDay && isSameDay(dragOverDay, day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={(e) => handleDragLeave(e)}
                onDrop={(e) => handleDrop(e, day)}
                className={`
                  min-h-[100px] p-2 border-r border-b cursor-pointer transition-all duration-200
                  ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                  ${isWeekend ? "bg-gray-50/50" : ""}
                  ${isDragOver ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" : "hover:bg-blue-50/30"}
                `}
              >
                <div className="flex flex-col h-full">
                  <div
                    className={`
                      w-8 h-8 flex items-center justify-center text-sm rounded-full mb-1
                      ${isTodayDate ? "bg-blue-600 text-white font-medium" : "text-gray-700"}
                      ${!isCurrentMonth ? "text-gray-400" : ""}
                    `}
                  >
                    {getDate(day)}
                  </div>

                  {/* Tasks for this day */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleTaskDragStart(e, task.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-xs px-2 py-1 rounded truncate cursor-move hover:opacity-80 transition-opacity select-none"
                        style={{
                          backgroundColor: task.category?.color + "20" || "#e3f2fd",
                          borderLeft: `3px solid ${task.category?.color || "#2196f3"}`,
                          color: task.category?.color || "#1976d2",
                        }}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length === 0 && isDragOver && (
                      <div className="text-xs text-blue-500 text-center py-2 border-2 border-dashed border-blue-300 rounded">
                        Перетащите сюда
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
