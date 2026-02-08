"use client";

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import PayoutCalendar from './PayoutCalendar';

interface MiningStats {
  revenue: {
    lastWithdrawal: string;
    confirmedBalance: number;
    payoutThreshold: number;
    today: number;
  };
  hashrate: {
    avg24h: number;
  };
  payoutDates: string[];
}

export default function MiningPanel() {
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financial/mining-stats');
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Ошибка загрузки статистики майнинга:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Вычисляем процент прогресса до выплаты
  const progress = stats
    ? Math.min((stats.revenue.confirmedBalance / stats.revenue.payoutThreshold) * 100, 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Заголовок */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">HashVault Mining</h2>
          <p className="text-sm text-gray-500">Статистика майнинга Monero</p>
        </div>
        <button
          onClick={fetchStats}
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

      {/* Статистика */}
      {!error && stats && (
        <>
          {/* Основные метрики */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Последняя выплата</p>
              <p className="text-lg font-semibold text-gray-800">{stats.revenue.lastWithdrawal}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Хешрейт (24ч)</p>
              <p className="text-lg font-semibold text-gray-800">
                {stats.hashrate.avg24h.toFixed(2)} H/s
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Заработано сегодня</p>
              <p className="text-lg font-semibold text-green-600">
                {stats.revenue.today.toFixed(6)} XMR
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Баланс</p>
              <p className="text-lg font-semibold text-blue-600">
                {stats.revenue.confirmedBalance.toFixed(6)} XMR
              </p>
            </div>
          </div>

          {/* Прогресс-бар до выплаты */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">До выплаты</p>
              <p className="text-sm font-semibold text-gray-800">
                {progress.toFixed(1)}%
              </p>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Порог выплаты: {stats.revenue.payoutThreshold.toFixed(6)} XMR
            </p>
          </div>

          {/* Календарь выплат */}
          <PayoutCalendar payoutDates={stats.payoutDates} />
        </>
      )}

      {/* Индикатор загрузки */}
      {loading && !stats && (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
