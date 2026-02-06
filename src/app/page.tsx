"use client";

import { useState } from "react";
import Calendar from "@/components/Calendar";
import TaskList from "@/components/TaskList";
import CreateTaskButton from "@/components/CreateTaskButton";
import DayView from "@/components/DayView";
import QuickAddTask from "@/components/QuickAddTask";
import PushNotificationManager from "@/components/PushNotificationManager";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTasksChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCloseDayView = () => {
    setSelectedDate(null);
  };

  const handleAddTask = (date: Date) => {
    // Открываем быстрое добавление задачи поверх DayView
    setQuickAddDate(date);
    setShowQuickAdd(true);
  };

  const handleCloseQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddDate(null);
  };

  const handleTaskCreated = () => {
    // Обновляем DayView после создания задачи
    setShowQuickAdd(false);
    setQuickAddDate(null);
    // DayView сам обновится при изменении localStorage
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Top App Bar */}
      <header className="flex items-center px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl text-gray-600 font-light">Календарь</span>
          </div>
        </div>
        <div className="flex-1"></div>
        <PushNotificationManager />
        <CreateTaskButton />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - for future menu */}
        <aside className="w-16 border-r bg-gray-50 flex flex-col items-center py-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
            <span className="text-gray-400 text-xs">Меню</span>
          </div>
        </aside>

        {/* Calendar - center */}
        <div className="flex-1 overflow-auto">
          <Calendar key={refreshKey} onDateSelect={handleDateSelect} />
        </div>

        {/* Right sidebar - tasks */}
        <aside className="w-80 border-l bg-white flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800">Мои задачи</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <TaskList onTasksChange={handleTasksChange} />
          </div>
        </aside>
      </div>

      {/* Day View Modal */}
      {selectedDate && (
        <DayView
          date={selectedDate}
          onClose={handleCloseDayView}
          onAddTask={handleAddTask}
          onTaskChange={handleTasksChange}
        />
      )}

      {/* Quick Add Task Modal */}
      {showQuickAdd && quickAddDate && (
        <QuickAddTask
          date={quickAddDate}
          onClose={handleCloseQuickAdd}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </main>
  );
}
