"use client";

/**
 * Компонент календаря выплат майнинга за текущий месяц.
 *
 * Отображает сетку дней текущего месяца (7 столбцов x N строк) с визуальным
 * выделением дней, в которые были произведены выплаты из пула HashVault.
 *
 * Особенности:
 * - Неделя начинается с понедельника (weekStartsOn: 1)
 * - Дни выплат подсвечиваются зелёным цветом
 * - Текущий день обводится жёлтой рамкой
 * - Дни соседних месяцев отображаются приглушённым цветом
 * - Внизу — легенда с обозначениями цветов
 * - Название месяца на русском языке (date-fns + ru локаль)
 *
 * Используется внутри MiningPanel для визуализации истории выплат.
 */

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';

/** Пропсы компонента PayoutCalendar */
interface PayoutCalendarProps {
  /** Массив дат выплат в формате "YYYY-MM-DD" */
  payoutDates: string[];
}

/**
 * Компонент календаря выплат.
 * Строит сетку дней текущего месяца и подсвечивает дни с выплатами.
 *
 * @param payoutDates - Массив строк с датами выплат (формат "YYYY-MM-DD")
 * @returns JSX-элемент с заголовком, сеткой дней и легендой
 */
export default function PayoutCalendar({ payoutDates }: PayoutCalendarProps) {
  // ==================== Вычисление диапазона дней календаря ====================

  /** Текущая дата для определения месяца */
  const today = new Date();

  /** Первый день текущего месяца */
  const monthStart = startOfMonth(today);

  /** Последний день текущего месяца */
  const monthEnd = endOfMonth(today);

  /**
   * Начало календарной сетки: понедельник недели, в которой находится первый день месяца.
   * Параметр weekStartsOn: 1 означает, что неделя начинается с понедельника (ISO стандарт).
   */
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  /**
   * Конец календарной сетки: воскресенье недели, в которой находится последний день месяца.
   * Это обеспечивает заполнение полных недель в сетке.
   */
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  /** Массив всех дней для отображения в сетке (включая дни соседних месяцев) */
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  /**
   * Конвертируем массив дат выплат в Set для быстрого поиска O(1).
   * Это оптимизация: вместо Array.includes() (O(n)) используем Set.has() (O(1)).
   */
  const payoutSet = new Set(payoutDates);

  /** Названия дней недели на русском языке (от понедельника до воскресенья) */
  const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  /** Название текущего месяца и года на русском (например, "февраль 2026") */
  const monthTitle = format(today, 'LLLL yyyy', { locale: ru });

  // ==================== Рендеринг ====================

  return (
    <div>
      {/* Заголовок: "Календарь выплат" слева и название месяца справа */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Календарь выплат</h3>
        <span className="text-sm text-amber-400 font-medium capitalize">{monthTitle}</span>
      </div>

      {/* Строка заголовков дней недели (ПН, ВТ, ..., ВС) */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Сетка дней календаря */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          /** Дата в формате "yyyy-MM-dd" для сравнения с датами выплат */
          const dateStr = format(day, 'yyyy-MM-dd');

          /** Принадлежит ли день текущему месяцу (для приглушения дней соседних месяцев) */
          const isCurrentMonth = isSameMonth(day, today);

          /** Была ли выплата в этот день (поиск по Set) */
          const isPayoutDay = payoutSet.has(dateStr);

          /** Является ли этот день сегодняшним */
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

          return (
            <div
              key={index}
              className={`
                text-center py-1.5 text-sm rounded
                ${!isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}
                ${isPayoutDay ? 'bg-emerald-600 text-white font-semibold' : 'bg-gray-700/50'}
                ${isToday && !isPayoutDay ? 'ring-2 ring-amber-400 text-white' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Легенда: пояснение цветовых обозначений */}
      <div className="mt-3 flex gap-4 text-xs text-gray-400">
        {/* Зелёный квадрат — день с выплатой */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-600 rounded"></div>
          <span>Выплата</span>
        </div>
        {/* Серый квадрат с жёлтой рамкой — сегодняшний день */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-700 ring-2 ring-amber-400 rounded"></div>
          <span>Сегодня</span>
        </div>
      </div>
    </div>
  );
}
