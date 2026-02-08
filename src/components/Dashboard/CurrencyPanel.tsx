"use client";

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import RateChart from './RateChart';

interface CurrencyPanelProps {
  title: string;
  panelTitle: string;
  source: string;
  endpoint: string;
  color: string;
  icon: string;
  badge: string;
  badgeColor?: string;
  gradient: string;
  unit: string;
  chartTitle?: string;
  isKeyRate?: boolean;
}

interface RateData {
  value?: number;
  rate?: number;
  price?: number;
  date?: string;
  timestamp?: number;
}

interface HistoryData {
  date: string;
  value?: number;
  rate?: number;
}

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
  const [rate, setRate] = useState<RateData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const rateResponse = await fetch(endpoint);
      if (!rateResponse.ok) {
        throw new Error(`Ошибка HTTP: ${rateResponse.status}`);
      }
      const rateData = await rateResponse.json();
      setRate(rateData);

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

  useEffect(() => {
    fetchData();
  }, [days]);

  // Поддержка разных форматов API: CurrencyRate (value/date), CryptoRate (price/timestamp), KeyRate (rate/date)
  const displayValue = isKeyRate
    ? rate?.rate?.toFixed(2)
    : (rate?.value ?? rate?.price)?.toFixed(4);

  const displayDate = rate?.date
    ? new Date(rate.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : rate?.timestamp
      ? new Date(rate.timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

  const chartData = history.map(item => ({
    date: item.date,
    value: isKeyRate ? (item.rate || 0) : (item.value || 0)
  }));

  // Вычисляем мин/макс/изменение
  const values = chartData.map(d => d.value).filter(v => v > 0);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const changePercent = values.length >= 2
    ? ((values[values.length - 1] - values[0]) / values[0]) * 100
    : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col">
      {/* Заголовок панели */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {panelTitle}
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
          {badge}
        </span>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-300 font-semibold">Ошибка загрузки данных</p>
          <p className="text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Основной контент: карточка + график */}
      {!error && rate && (
        <div className="flex gap-4 flex-1">
          {/* Левая карточка с градиентом */}
          <div className={`${gradient} rounded-xl p-5 flex flex-col justify-between min-w-[200px] relative`}>
            {/* Кнопка обновления */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>

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

            <p className="text-white/60 text-sm mt-3">
              {displayDate}
            </p>
          </div>

          {/* Правая часть: график */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Заголовок графика + селектор периода */}
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

            {/* График */}
            {history.length > 0 && (
              <div className="flex-1">
                <RateChart data={chartData} color={color} label={title} />
              </div>
            )}

            {/* Мин / Макс / Изменение */}
            {values.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-400">
                  Мин: <span className="text-white font-semibold">{minVal.toFixed(2)}</span>
                </span>
                <span className="text-gray-400">
                  Макс: <span className="text-white font-semibold">{maxVal.toFixed(2)}</span>
                </span>
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

      {/* Индикатор загрузки */}
      {loading && !rate && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
}
