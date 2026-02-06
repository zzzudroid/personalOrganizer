"use client";

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

const formatDateForStorage = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export default function Calendar({ onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
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
    setDragOverDay(null);
  };

  const handleDrop = async (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(null);
    
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: formatDateForStorage(day) }),
      });

      if (response.ok) {
        loadTasks();
      }
    } catch (error) {
      console.error("Ошибка при перемещении задачи:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverDay(null);
  };

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
            {format(currentDate, "LLLL yyyy", { locale: ru })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Move className="w-4 h-4" />
          <span>Перетаскивайте задачи</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {/* Weekday Headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
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
                <div className={`
                  text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday(day) ? "bg-blue-600 text-white" : "text-gray-700"}
                `}>
                  {getDate(day)}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`
                        text-xs px-2 py-1 rounded truncate cursor-move
                        ${task.status === "done" ? "bg-gray-100 line-through text-gray-400" : "bg-blue-100 text-blue-800"}
                        ${draggedTaskId === task.id ? "opacity-50" : ""}
                      `}
                    >
                      {task.title}
                    </div>
                  ))}
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
