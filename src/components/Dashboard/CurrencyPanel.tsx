"use client";

/**
 * Универсальная панель отображения валютного/финансового курса.
 *
 * Компонент используется для отображения различных финансовых данных:
 * - Курс USD/RUB (ЦБ РФ)
 * - Курс XMR/USDT (биржа MEXC)
 * - Ключевая ставка ЦБ РФ
 *
 * Состоит из двух частей:
 * 1. Левая карточка с градиентом — текущее значение курса и дата
 * 2. Правая часть — линейный график истории за выбранный период (30/60/90 дней)
 *    с отображением мин/макс значений и процента изменения
 *
 * Данные загружаются из API при монтировании и при смене периода.
 * Поддерживает ручное обновление по кнопке (автообновление отсутствует).
 */

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import RateChart from './RateChart';

/** Пропсы компонента CurrencyPanel — описывают внешний вид и источник данных панели */
interface CurrencyPanelProps {
  /** Название отображаемого показателя (например, "Курс USD") */
  title: string;
  /** Заголовок панели, отображается в шапке */
  panelTitle: string;
  /** Текстовое описание источника данных (например, "ЦБ РФ") */
  source: string;
  /** Базовый URL API-эндпоинта для получения данных (текущий курс + /history для истории) */
  endpoint: string;
  /** Цвет линии графика (HEX-строка, например "#3b82f6") */
  color: string;
  /** Эмодзи-иконка, отображаемая рядом с заголовком */
  icon: string;
  /** Текст бейджа в правом верхнем углу (например, "ЦБ РФ", "MEXC") */
  badge: string;
  /** CSS-классы для стилизации бейджа (цвет фона и текста) */
  badgeColor?: string;
  /** CSS-классы градиента для левой карточки (например, "bg-gradient-to-br from-blue-500 to-blue-700") */
  gradient: string;
  /** Единица измерения, отображаемая под значением (например, "руб.", "USDT", "%") */
  unit: string;
  /** Заголовок секции графика */
  chartTitle?: string;
  /** Флаг: если true, используется поле rate вместо value/price (для ключевой ставки ЦБ) */
  isKeyRate?: boolean;
}

/**
 * Интерфейс ответа API для текущего курса.
 * Разные API возвращают значение в разных полях:
 * - value — курс валюты ЦБ РФ
 * - rate — ключевая ставка ЦБ РФ
 * - price — цена криптовалюты (MEXC)
 * - date — дата в строковом формате (ЦБ РФ)
 * - timestamp — временная метка в миллисекундах (MEXC)
 */
interface RateData {
  value?: number;
  rate?: number;
  price?: number;
  date?: string;
  timestamp?: number;
}

/**
 * Интерфейс одной точки исторических данных.
 * Поле value используется для валютных курсов, rate — для ключевой ставки.
 */
interface HistoryData {
  date: string;
  value?: number;
  rate?: number;
}

/**
 * Компонент универсальной финансовой панели.
 * Отображает текущее значение показателя и график его динамики за выбранный период.
 *
 * @param props - Параметры конфигурации панели (заголовок, эндпоинт, цвета, и т.д.)
 * @returns JSX-элемент с карточкой текущего значения и графиком истории
 */
export default function CurrencyPanel({
  title,
  panelTitle,
  source,
  endpoint,
  color,
  icon,
  badge,
  badgeColor = 'bg-gray-600 text-gray-200',
  gradient,
  unit,
  chartTitle = 'График за месяц',
  isKeyRate = false
}: CurrencyPanelProps) {
  // ==================== Состояние компонента ====================

  /** Текущие данные курса (последнее полученное значение) */
  const [rate, setRate] = useState<RateData | null>(null);

  /** Массив исторических данных для построения графика */
  const [history, setHistory] = useState<HistoryData[]>([]);

  /** Количество дней для отображения на графике (30, 60 или 90) */
  const [days, setDays] = useState(30);

  /** Флаг загрузки данных (для отображения спиннера и блокировки кнопки) */
  const [loading, setLoading] = useState(false);

  /** Текст ошибки при неудачной загрузке данных (null если ошибки нет) */
  const [error, setError] = useState<string | null>(null);

  // ==================== Загрузка данных ====================

  /**
   * Загружает текущий курс и историческите данные из API.
   * Выполняет два последовательных запроса:
   * 1. GET {endpoint} — текущее значение курса
   * 2. GET {endpoint}/history?days={N} — исторические данные за N дней
   *
   * При ошибке устанавливает сообщение в state error.
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Запрос текущего значения курса
      const rateResponse = await fetch(endpoint);
      if (!rateResponse.ok) {
        throw new Error(`Ошибка HTTP: ${rateResponse.status}`);
      }
      const rateData = await rateResponse.json();
      setRate(rateData);

      // Запрос исторических данных за выбранный период
      const historyResponse = await fetch(`${endpoint}/history?days=${days}`);
      if (!historyResponse.ok) {
        throw new Error(`Ошибка HTTP: ${historyResponse.status}`);
      }
      const historyData = await historyResponse.json();
      setHistory(historyData);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Эффект: загружает данные при монтировании компонента
   * и при изменении выбранного периода (days).
   */
  useEffect(() => {
    fetchData();
  }, [days]);

  // ==================== Вычисляемые значения для отображения ====================

  /**
   * Определяем отображаемое значение в зависимости от типа данных:
   * - Для ключевой ставки: поле rate с 2 знаками после запятой
   * - Для валют/крипто: поле value или price с 4 знаками после запятой
   */
  const displayValue = isKeyRate
    ? rate?.rate?.toFixed(2)
    : (rate?.value ?? rate?.price)?.toFixed(4);

  /**
   * Форматируем дату для отображения под значением курса.
   * - Если есть поле date — форматируем как дату (ДД.ММ.ГГГГ)
   * - Если есть timestamp — форматируем как дату + время (ДД.ММ.ГГГГ ЧЧ:ММ)
   * - Иначе — пустая строка
   */
  const displayDate = rate?.date
    ? new Date(rate.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : rate?.timestamp
      ? new Date(rate.timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

  /**
   * Подготовка данных для графика: приводим к единому формату {date, value}.
   * Для ключевой ставки используем поле rate, для остальных — value.
   */
  const chartData = history.map(item => ({
    date: item.date,
    value: isKeyRate ? (item.rate || 0) : (item.value || 0)
  }));

  // ==================== Статистика по графику (мин/макс/изменение) ====================

  /** Массив числовых значений для вычисления статистики (фильтруем нулевые) */
  const values = chartData.map(d => d.value).filter(v => v > 0);

  /** Минимальное значение за период */
  const minVal = values.length > 0 ? Math.min(...values) : 0;

  /** Максимальное значение за период */
  const maxVal = values.length > 0 ? Math.max(...values) : 0;

  /**
   * Процент изменения за период: ((последнее - первое) / первое) * 100.
   * Положительное значение — рост, отрицательное — падение.
   */
  const changePercent = values.length >= 2
    ? ((values[values.length - 1] - values[0]) / values[0]) * 100
    : 0;

  // ==================== Рендеринг ====================

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col">
      {/* Заголовок панели: иконка + название + бейдж источника */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {panelTitle}
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
          {badge}
        </span>
      </div>

      {/* Блок ошибки: красная карточка с описанием проблемы */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-300 font-semibold">Ошибка загрузки данных</p>
          <p className="text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Основной контент: отображается только при наличии данных и отсутствии ошибки */}
      {!error && rate && (
        <div className="flex gap-4 flex-1">
          {/* Левая карточка с градиентом — текущее значение курса */}
          <div className={`${gradient} rounded-xl p-5 flex flex-col justify-between min-w-[200px] relative`}>
            {/* Кнопка ручного обновления данных */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Значение курса и единица измерения */}
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-white">
                  {displayValue}
                </span>
              </div>
              <span className="text-white/80 text-base mt-0.5 block">
                {unit}
              </span>
            </div>

            {/* Дата последнего обновления */}
            <p className="text-white/60 text-sm mt-3">
              {displayDate}
            </p>
          </div>

          {/* Правая часть: график динамики курса */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Заголовок графика и выпадающий список выбора периода */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-400">{chartTitle}</h3>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-gray-500 cursor-pointer"
              >
                <option value={30}>30 дней</option>
                <option value={60}>60 дней</option>
                <option value={90}>90 дней</option>
              </select>
            </div>

            {/* Линейный график (Chart.js) — отображается только при наличии данных */}
            {history.length > 0 && (
              <div className="flex-1">
                <RateChart data={chartData} color={color} label={title} />
              </div>
            )}

            {/* Блок статистики: минимум, максимум и процент изменения за период */}
            {values.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-400">
                  Мин: <span className="text-white font-semibold">{minVal.toFixed(2)}</span>
                </span>
                <span className="text-gray-400">
                  Макс: <span className="text-white font-semibold">{maxVal.toFixed(2)}</span>
                </span>
                {/* Бейдж изменения: зелёный при росте, красный при падении */}
                <span className={`
                  px-2.5 py-0.5 rounded-full text-xs font-bold
                  ${changePercent >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}
                `}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Индикатор загрузки: отображается при первой загрузке (когда данных ещё нет) */}
      {loading && !rate && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
}
