"use client";

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PayoutCalendarProps {
  payoutDates: string[]; // YYYY-MM-DD[]
}

export default function PayoutCalendar({ payoutDates }: PayoutCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Конвертируем массив дат выплат в Set для быстрого поиска
  const payoutSet = new Set(payoutDates);

  // Дни недели
  const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  // Название месяца
  const monthTitle = format(today, 'LLLL yyyy', { locale: ru });

  return (
    <div>
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Календарь выплат</h3>
        <span className="text-sm text-amber-400 font-medium capitalize">{monthTitle}</span>
      </div>

      {/* Заголовок с днями недели */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Дни календаря */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, today);
          const isPayoutDay = payoutSet.has(dateStr);
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

      {/* Легенда */}
      <div className="mt-3 flex gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-600 rounded"></div>
          <span>Выплата</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-700 ring-2 ring-amber-400 rounded"></div>
          <span>Сегодня</span>
        </div>
      </div>
    </div>
  );
}
