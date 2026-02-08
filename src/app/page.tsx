/**
 * @file Главная страница приложения — Календарь с управлением задачами
 * @description Центральный хаб для управления задачами и просмотра календаря.
 * Является Client Component ("use client"), так как содержит интерактивную логику:
 * - Выбор даты в календаре
 * - Модальные окна (DayView, QuickAddTask, PWAInstallGuide)
 * - Синхронизация состояния между компонентами через callback-паттерн
 *
 * Архитектура синхронизации компонентов:
 * Используется паттерн "refreshKey" — при изменении задачи вызывается onTasksChange,
 * который инкрементирует refreshKey. Компоненты Calendar и TaskList имеют key={refreshKey},
 * что заставляет React перемонтировать их и загрузить свежие данные из API.
 *
 * Макет страницы (десктоп):
 * ┌─────────────────────────────────────────────┐
 * │              Header (App Bar)                │
 * ├────┬──────────────────────┬──────────────────┤
 * │Menu│     Calendar         │   TaskList       │
 * │    │     (центр)          │   (правая панель) │
 * │    │                      │                  │
 * └────┴──────────────────────┴──────────────────┘
 */

"use client";

import { useState } from "react";
import Calendar from "@/components/Calendar";
import TaskList from "@/components/TaskList";
import CreateTaskButton from "@/components/CreateTaskButton";
import DayView from "@/components/DayView";
import QuickAddTask from "@/components/QuickAddTask";
import PushNotificationManager from "@/components/PushNotificationManager";
import PWAInstallGuide from "@/components/PWAInstallGuide";
import { Download } from "lucide-react";

/**
 * Главный компонент страницы — управляет состоянием и координирует дочерние компоненты.
 *
 * Состояния:
 * - selectedDate: выбранная дата для отображения в DayView (null = модалка закрыта)
 * - showQuickAdd/quickAddDate: состояние быстрого добавления задачи
 * - refreshKey: ключ для принудительной перезагрузки Calendar и TaskList
 * - showPWAGuide: отображение инструкции по установке PWA
 */
export default function Home() {
  // Выбранная дата — при установке открывается модальное окно DayView
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Состояние модалки быстрого добавления задачи
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  // Дата для быстрого добавления задачи (из DayView)
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
  // Ключ для принудительного перемонтирования Calendar и TaskList при изменении задач
  const [refreshKey, setRefreshKey] = useState(0);
  // Отображение модалки с инструкцией установки PWA
  const [showPWAGuide, setShowPWAGuide] = useState(false);

  /**
   * Callback для синхронизации компонентов при изменении задач.
   * Инкрементирует refreshKey → Calendar и TaskList перемонтируются → загружают свежие данные.
   * Вызывается из TaskList, DayView и QuickAddTask при CRUD-операциях с задачами.
   */
  const handleTasksChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Обработчик выбора даты в календаре — открывает модальное окно DayView.
   * @param date - выбранная пользователем дата
   */
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  /**
   * Закрывает модальное окно DayView.
   */
  const handleCloseDayView = () => {
    setSelectedDate(null);
  };

  /**
   * Открывает форму быстрого добавления задачи поверх DayView.
   * Вызывается при нажатии кнопки "+" в DayView.
   * @param date - дата, на которую создается задача
   */
  const handleAddTask = (date: Date) => {
    // Открываем быстрое добавление задачи поверх DayView
    setQuickAddDate(date);
    setShowQuickAdd(true);
  };

  /**
   * Закрывает форму быстрого добавления задачи.
   */
  const handleCloseQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddDate(null);
  };

  /**
   * Обработчик успешного создания задачи через QuickAddTask.
   * Закрывает форму — DayView обновится автоматически через refreshKey.
   */
  const handleTaskCreated = () => {
    // Обновляем DayView после создания задачи
    setShowQuickAdd(false);
    setQuickAddDate(null);
    // DayView сам обновится при изменении localStorage
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* ==================== Верхняя панель приложения ==================== */}
      <header className="flex items-center px-4 py-3 border-b bg-white shadow-sm">
        {/* Логотип и заголовок */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Иконка календаря */}
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl text-gray-600 font-light">Календарь</span>
          </div>
        </div>
        {/* Разделитель — занимает все свободное пространство */}
        <div className="flex-1"></div>
        {/* Кнопка установки PWA */}
        <button
          onClick={() => setShowPWAGuide(true)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors mr-2"
          title="Установить приложение"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Установить</span>
        </button>
        {/* Управление push-уведомлениями */}
        <PushNotificationManager />
        {/* Кнопка создания новой задачи */}
        <CreateTaskButton />
      </header>

      {/* ==================== Основная область контента ==================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Левая боковая панель (для будущего меню навигации) */}
        <aside className="w-16 border-r bg-gray-50 flex flex-col items-center py-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
            <span className="text-gray-400 text-xs">Меню</span>
          </div>
        </aside>

        {/* Центральная область — компонент Calendar */}
        {/* key={refreshKey} обеспечивает перемонтирование при изменении задач */}
        <div className="flex-1 overflow-auto">
          <Calendar key={refreshKey} onDateSelect={handleDateSelect} />
        </div>

        {/* Правая боковая панель — список всех задач */}
        <aside className="w-80 border-l bg-white flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800">Мои задачи</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {/* key={refreshKey} обеспечивает перемонтирование при изменении задач */}
            <TaskList key={refreshKey} onTasksChange={handleTasksChange} />
          </div>
        </aside>
      </div>

      {/* ==================== Модальные окна ==================== */}

      {/* Модальное окно просмотра дня — показывает задачи на выбранную дату */}
      {selectedDate && (
        <DayView
          date={selectedDate}
          onClose={handleCloseDayView}
          onAddTask={handleAddTask}
          onTaskChange={handleTasksChange}
        />
      )}

      {/* Модальное окно быстрого добавления задачи (открывается поверх DayView) */}
      {showQuickAdd && quickAddDate && (
        <QuickAddTask
          date={quickAddDate}
          onClose={handleCloseQuickAdd}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {/* Модальное окно с инструкцией по установке PWA */}
      {showPWAGuide && (
        <PWAInstallGuide onClose={() => setShowPWAGuide(false)} />
      )}
    </main>
  );
}
