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
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col">
      {/* Заголовок панели */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">⛏</span>
          Майнинг
        </h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
          HashVault
        </span>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-300 font-semibold">Ошибка загрузки данных</p>
          <p className="text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Статистика */}
      {!error && stats && (
        <div className="flex gap-4 flex-1">
          {/* Левая карточка — статистика */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-5 flex flex-col min-w-[220px] relative">
            {/* Кнопка обновления */}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Monero логотип и название */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="text-white font-semibold text-sm">hashvault_monero</span>
            </div>

            {/* Метрики вертикальным списком */}
            <div className="space-y-3 flex-1">
              <div>
                <p className="text-gray-400 text-xs">Последняя выплата:</p>
                <p className="text-white font-semibold text-sm">{stats.revenue.lastWithdrawal}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-400 text-xs">К выплате:</p>
                  <span className="text-white text-xs font-semibold">{stats.revenue.confirmedBalance.toFixed(8)}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-right text-emerald-400 text-xs mt-0.5 font-semibold">
                  {progress.toFixed(1)}%
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Заработано сегодня:</p>
                <p className="text-emerald-400 font-semibold text-sm">{stats.revenue.today.toFixed(8)}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Хешрейт (24ч):</p>
                <p className="text-white font-semibold text-sm">{stats.hashrate.avg24h.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Правая часть — календарь выплат */}
          <div className="flex-1 min-w-0">
            <PayoutCalendar payoutDates={stats.payoutDates} />
          </div>
        </div>
      )}

      {/* Индикатор загрузки */}
      {loading && !stats && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
}
