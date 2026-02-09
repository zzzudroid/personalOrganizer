/**
 * @file Парсер для работы с HashVault API (пул майнинга Monero)
 * @description Модуль для получения статистики майнинга Monero с пула HashVault:
 * - Средний хешрейт за 24 часа
 * - Подтвержденный баланс на пуле
 * - Порог автоматической выплаты
 * - Дневной доход
 * - История выплат (даты для календаря)
 *
 * Используется публичный API HashVault v3 (требуется только адрес кошелька Monero).
 * Базовый URL: https://api.hashvault.pro/v3/monero
 *
 * Важная особенность: все суммы в API HashVault приходят в atomic units (piconero).
 * 1 XMR = 10^12 atomic units. Все суммы конвертируются в XMR перед возвратом.
 */

import { MiningStats } from './types';

// ============================================================================
// Вспомогательные функции форматирования
// ============================================================================

/**
 * Преобразует Unix timestamp (в секундах) в формат DD.MM.YYYY.
 * Используется для отображения даты последней выплаты в UI.
 *
 * Внимание: HashVault возвращает timestamp в СЕКУНДАХ (не миллисекундах),
 * поэтому умножаем на 1000 для создания Date.
 *
 * @param timestamp - Unix timestamp в секундах
 * @returns дата в формате "DD.MM.YYYY" (например, "15.01.2024")
 */
function formatDateDDMMYYYY(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Секунды → миллисекунды
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Преобразует Unix timestamp (в секундах) в формат YYYY-MM-DD.
 * Используется для дат выплат в календаре (ISO-подобный формат для сортировки).
 *
 * @param timestamp - Unix timestamp в секундах
 * @returns дата в формате "YYYY-MM-DD" (например, "2024-01-15")
 */
function formatDateYYYYMMDD(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Секунды → миллисекунды
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Конвертирует atomic units (piconero) в XMR.
 *
 * Monero использует 12 десятичных знаков:
 * 1 XMR = 1 000 000 000 000 atomic units (10^12)
 *
 * Пример: 500000000000 atomic units = 0.5 XMR
 *
 * @param atomic - сумма в atomic units (piconero)
 * @returns сумма в XMR
 */
function atomicToXMR(atomic: number): number {
  return atomic / 1e12;
}

// ============================================================================
// Интерфейсы для типизации ответов HashVault API
// ============================================================================

/**
 * Структура ответа от эндпоинта /wallet/{address}/stats.
 * Содержит коллективную статистику (хешрейт) и информацию о доходах.
 */
interface HashVaultStatsResponse {
  /** Коллективная статистика (общая для кошелька) */
  collective?: {
    /** Средний хешрейт за 24 часа в H/s (хеш в секунду) */
    avg24hashRate?: number;
  };
  /** Информация о доходах и балансе (в atomic units!) */
  revenue?: {
    /** Подтвержденный баланс на пуле (atomic units) */
    confirmedBalance?: number;
    /** Порог автоматической выплаты (atomic units) */
    payoutThreshold?: number;
    /** Начислено за сегодня (atomic units) */
    dailyCredited?: number;
  };
}

/**
 * Структура одной выплаты из эндпоинта /wallet/{address}/payments.
 * Массив таких объектов приходит отсортированным от новых к старым.
 */
interface HashVaultPayment {
  /** Временная метка выплаты (Unix timestamp в СЕКУНДАХ, не миллисекундах) */
  ts?: number;
  /** Сумма выплаты (в atomic units, нужно делить на 10^12 для XMR) */
  amount?: number;
}

// ============================================================================
// Основная функция парсера
// ============================================================================

/**
 * Получает полную статистику майнинга с пула HashVault.
 *
 * Выполняет два параллельных запроса к API HashVault:
 * 1. /stats — получение хешрейта, баланса, порога выплаты и дневного дохода
 * 2. /payments — получение истории выплат (для календаря и даты последней выплаты)
 *
 * Все суммы конвертируются из atomic units в XMR (деление на 10^12).
 * Даты выплат форматируются в два формата:
 * - DD.MM.YYYY для отображения последней выплаты
 * - YYYY-MM-DD для календаря выплат (PayoutCalendar компонент)
 *
 * @param walletAddress - адрес кошелька Monero (длинная строка ~95 символов)
 * @returns {Promise<MiningStats | null>} Объект со статистикой или null при ошибке
 */
export async function getHashVaultStats(walletAddress: string): Promise<MiningStats | null> {
  // Валидация входного параметра
  if (!walletAddress) {
    console.error('Адрес кошелька не предоставлен');
    return null;
  }

  try {
    // ---- Запрос 1: Получаем статистику (хешрейт и финансовые данные) ----
    const statsUrl = `https://api.hashvault.pro/v3/monero/wallet/${walletAddress}/stats?poolType=false`;
    const statsResponse = await fetch(statsUrl, {
      headers: {
        'Accept': 'application/json' // Явно запрашиваем JSON-ответ
      },
      cache: 'no-store' // Отключаем кеширование Next.js для актуальных данных
    });

    if (!statsResponse.ok) {
      console.error(`Ошибка HTTP при получении статистики: ${statsResponse.status}`);
      return null;
    }

    const statsData: HashVaultStatsResponse = await statsResponse.json();

    // ---- Запрос 2: Получаем историю выплат ----
    const paymentsUrl = `https://api.hashvault.pro/v3/monero/wallet/${walletAddress}/payments?poolType=false`;
    const paymentsResponse = await fetch(paymentsUrl, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store' // Отключаем кеширование Next.js для актуальных данных
    });

    if (!paymentsResponse.ok) {
      console.error(`Ошибка HTTP при получении выплат: ${paymentsResponse.status}`);
      return null;
    }

    const paymentsData: HashVaultPayment[] = await paymentsResponse.json();

    // ---- Обработка данных статистики ----
    // Используем пустые объекты как fallback, если поля отсутствуют
    const collective = statsData.collective || {};
    const revenue = statsData.revenue || {};

    // Конвертируем все суммы из atomic units (piconero) в XMR
    const confirmedBalance = atomicToXMR(revenue.confirmedBalance || 0); // Баланс на пуле
    const payoutThreshold = atomicToXMR(revenue.payoutThreshold || 0);   // Порог выплаты
    const dailyCredited = atomicToXMR(revenue.dailyCredited || 0);       // Доход за сегодня

    // Средний хешрейт за 24 часа (уже в H/s, конвертация не нужна)
    const avg24h = collective.avg24hashRate || 0;

    // ---- Обработка данных о выплатах ----
    // Определяем дату последней выплаты для отображения в панели
    let lastWithdrawal = 'Нет данных';
    if (paymentsData && paymentsData.length > 0) {
      const lastPayment = paymentsData[0]; // Первая выплата в массиве — самая свежая
      if (lastPayment.ts) {
        lastWithdrawal = formatDateDDMMYYYY(lastPayment.ts); // Формат DD.MM.YYYY для UI
      }
    }

    // Собираем все даты выплат для отображения в календаре (PayoutCalendar)
    const payoutDates: string[] = [];
    if (Array.isArray(paymentsData)) {
      for (const payment of paymentsData) {
        if (payment.ts) {
          const dateStr = formatDateYYYYMMDD(payment.ts); // Формат YYYY-MM-DD для календаря
          payoutDates.push(dateStr);
        }
      }
    }

    // ---- Формируем итоговый результат ----
    return {
      revenue: {
        lastWithdrawal,     // Дата последней выплаты (DD.MM.YYYY или "Нет данных")
        confirmedBalance,   // Подтвержденный баланс в XMR
        payoutThreshold,    // Порог автовыплаты в XMR
        today: dailyCredited // Доход за сегодня в XMR
      },
      hashrate: {
        avg24h // Средний хешрейт за 24 часа (H/s)
      },
      payoutDates // Массив дат выплат для календаря (YYYY-MM-DD[])
    };
  } catch (error) {
    console.error('Ошибка получения статистики HashVault:', error);
    return null;
  }
}
