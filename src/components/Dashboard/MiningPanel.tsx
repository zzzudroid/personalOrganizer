"use client";

/**
 * Панель статистики майнинга Monero (XMR) через пул HashVault.
 *
 * Компонент отображает:
 * - Сумму последней выплаты
 * - Текущий подтверждённый баланс с прогресс-баром до порога выплаты
 * - Заработок за сегодня
 * - Средний хешрейт за 24 часа
 * - Календарь выплат (компонент PayoutCalendar)
 *
 * Данные загружаются из /api/financial/mining-stats.
 * API обращается к публичному HashVault API по адресу кошелька.
 * Все суммы отображаются в XMR (конвертация из atomic units происходит на бэкенде).
 *
 * Обновление данных — только по кнопке (автообновление отсутствует).
 */

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import PayoutCalendar from './PayoutCalendar';

/**
 * Интерфейс данных статистики майнинга, получаемых от API.
 * Структура соответствует формату ответа /api/financial/mining-stats.
 */
interface MiningStats {
  /** Данные о доходах и балансе */
  revenue: {
    /** Дата/сумма последней выплаты в формате строки */
    lastWithdrawal: string;
    /** Текущий подтверждённый баланс в XMR (дробное число) */
    confirmedBalance: number;
    /** Минимальный порог для автоматической выплаты в XMR */
    payoutThreshold: number;
    /** Заработок за текущий день в XMR */
    today: number;
  };
  /** Данные о производительности */
  hashrate: {
    /** Средний хешрейт за последние 24 часа (H/s) */
    avg24h: number;
  };
  /** Массив дат выплат в формате "YYYY-MM-DD" для отображения в календаре */
  payoutDates: string[];
}

/**
 * Компонент панели майнинга.
 * Загружает и отображает статистику майнинга Monero из пула HashVault.
 *
 * Макет: двухколоночный — слева карточка со статистикой, справа календарь выплат.
 *
 * @returns JSX-элемент панели майнинга
 */
export default function MiningPanel() {
  // ==================== Состояние компонента ====================

  /** Данные статистики майнинга (null до первой загрузки) */
  const [stats, setStats] = useState<MiningStats | null>(null);

  /** Флаг загрузки данных (для спиннера и блокировки кнопки обновления) */
  const [loading, setLoading] = useState(false);

  /** Текст ошибки загрузки (null если ошибки нет) */
  const [error, setError] = useState<string | null>(null);

  // ==================== Загрузка данных ====================

  /**
   * Загружает статистику майнинга из API.
   * Выполняет GET-запрос к /api/financial/mining-stats.
   * При ошибке сохраняет сообщение об ошибке в state.
   */
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

  /** Эффект: загружает данные при монтировании компонента */
  useEffect(() => {
    fetchStats();
  }, []);

  // ==================== Вычисляемые значения ====================

  /**
   * Процент прогресса до следующей выплаты.
   * Рассчитывается как (подтверждённый баланс / порог выплаты) * 100.
   * Ограничен максимумом 100% с помощью Math.min.
   */
  const progress = stats
    ? Math.min((stats.revenue.confirmedBalance / stats.revenue.payoutThreshold) * 100, 100)
    : 0;

  // ==================== Рендеринг ====================

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col">
      {/* Заголовок панели: иконка кирки + название + бейдж "HashVault" */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">⛏</span>
          Майнинг
        </h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
          HashVault
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
      {!error && stats && (
        <div className="flex gap-4 flex-1">
          {/* Левая карточка — статистика майнинга */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-5 flex flex-col min-w-[220px] relative">
            {/* Кнопка ручного обновления данных */}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Monero логотип (оранжевый круг с "M") и идентификатор пула */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="text-white font-semibold text-sm">hashvault_monero</span>
            </div>

            {/* Метрики майнинга: вертикальный список показателей */}
            <div className="space-y-3 flex-1">
              {/* Последняя выплата: дата и сумма */}
              <div>
                <p className="text-gray-400 text-xs">Последняя выплата:</p>
                <p className="text-white font-semibold text-sm">{stats.revenue.lastWithdrawal}</p>
              </div>

              {/* Прогресс до следующей выплаты: баланс + прогресс-бар */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-400 text-xs">К выплате:</p>
                  {/* Баланс отображается с 8 знаками после запятой (стандарт для XMR) */}
                  <span className="text-white text-xs font-semibold">{stats.revenue.confirmedBalance.toFixed(8)}</span>
                </div>
                {/* Прогресс-бар: заполняется пропорционально (баланс / порог выплаты) */}
                <div className="w-full h-2.5 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Числовое значение процента прогресса */}
                <p className="text-right text-emerald-400 text-xs mt-0.5 font-semibold">
                  {progress.toFixed(1)}%
                </p>
              </div>

              {/* Заработок за текущий день */}
              <div>
                <p className="text-gray-400 text-xs">Заработано сегодня:</p>
                <p className="text-emerald-400 font-semibold text-sm">{stats.revenue.today.toFixed(8)}</p>
              </div>

              {/* Средний хешрейт за последние 24 часа */}
              <div>
                <p className="text-gray-400 text-xs">Хешрейт (24ч):</p>
                <p className="text-white font-semibold text-sm">{stats.hashrate.avg24h.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Правая часть — календарь выплат за текущий месяц */}
          <div className="flex-1 min-w-0">
            <PayoutCalendar payoutDates={stats.payoutDates} />
          </div>
        </div>
      )}

      {/* Индикатор загрузки: отображается при первой загрузке (когда данных ещё нет) */}
      {loading && !stats && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
}
