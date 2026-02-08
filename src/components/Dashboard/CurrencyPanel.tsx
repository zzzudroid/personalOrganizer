"use client";

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import RateChart from './RateChart';

interface CurrencyPanelProps {
  title: string;
  source: string;
  endpoint: string;
  color: string;
  isKeyRate?: boolean; // Флаг для ключевой ставки ЦБ
}

interface RateData {
  value?: number;
  rate?: number;
  date: string;
}

interface HistoryData {
  date: string;
  value?: number;
  rate?: number;
}

export default function CurrencyPanel({ title, source, endpoint, color, isKeyRate = false }: CurrencyPanelProps) {
  const [rate, setRate] = useState<RateData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Загружаем текущий курс
      const rateResponse = await fetch(endpoint);
      if (!rateResponse.ok) {
        throw new Error(`Ошибка HTTP: ${rateResponse.status}`);
      }
      const rateData = await rateResponse.json();
      setRate(rateData);

      // Загружаем историю
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

  // Определяем отображаемое значение
  const displayValue = isKeyRate
    ? rate?.rate?.toFixed(2)
    : rate?.value?.toFixed(2);

  // Подготавливаем данные для графика
  const chartData = history.map(item => ({
    date: item.date,
    value: isKeyRate ? (item.rate || 0) : (item.value || 0)
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Заголовок */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{source}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Обновить данные"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-700 font-semibold">Ошибка загрузки данных</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Текущий курс */}
      {!error && rate && (
        <>
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color }}>
                {displayValue}
              </span>
              <span className="text-gray-500 text-lg">
                {isKeyRate ? '%' : '₽'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              на {new Date(rate.date).toLocaleDateString('ru-RU')}
            </p>
          </div>

          {/* График */}
          {history.length > 0 && (
            <>
              <RateChart data={chartData} color={color} label={title} />

              {/* Селектор периода */}
              <div className="mt-4 flex gap-2">
                {[30, 60, 90].map(period => (
                  <button
                    key={period}
                    onClick={() => setDays(period)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${days === period
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {period} дней
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Индикатор загрузки */}
      {loading && !rate && (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
