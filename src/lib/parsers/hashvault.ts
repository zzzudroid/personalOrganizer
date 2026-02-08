// Парсер для работы с HashVault API (пул майнинга Monero)
import { MiningStats } from './types';

/**
 * Преобразует timestamp (в секундах) в формат DD.MM.YYYY
 */
function formatDateDDMMYYYY(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Преобразует timestamp (в секундах) в формат YYYY-MM-DD
 */
function formatDateYYYYMMDD(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Конвертирует atomic units в XMR
 * 1 XMR = 10^12 atomic units (piconero)
 */
function atomicToXMR(atomic: number): number {
  return atomic / 1e12;
}

/**
 * Интерфейсы для типизации данных от HashVault API
 */
interface HashVaultStatsResponse {
  collective?: {
    avg24hashRate?: number;
  };
  revenue?: {
    confirmedBalance?: number;
    payoutThreshold?: number;
    dailyCredited?: number;
  };
}

interface HashVaultPayment {
  ts?: number; // timestamp в секундах
  amount?: number; // сумма в atomic units
}

/**
 * Получает статистику майнинга с пула HashVault
 * @param walletAddress - адрес кошелька Monero
 */
export async function getHashVaultStats(walletAddress: string): Promise<MiningStats | null> {
  if (!walletAddress) {
    console.error('Адрес кошелька не предоставлен');
    return null;
  }

  try {
    // Получаем статистику (хешрейт и доход)
    const statsUrl = `https://api.hashvault.pro/v3/monero/wallet/${walletAddress}/stats?poolType=false`;
    const statsResponse = await fetch(statsUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      console.error(`Ошибка HTTP при получении статистики: ${statsResponse.status}`);
      return null;
    }

    const statsData: HashVaultStatsResponse = await statsResponse.json();

    // Получаем историю выплат
    const paymentsUrl = `https://api.hashvault.pro/v3/monero/wallet/${walletAddress}/payments?poolType=false`;
    const paymentsResponse = await fetch(paymentsUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!paymentsResponse.ok) {
      console.error(`Ошибка HTTP при получении выплат: ${paymentsResponse.status}`);
      return null;
    }

    const paymentsData: HashVaultPayment[] = await paymentsResponse.json();

    // Извлекаем данные из ответа API
    const collective = statsData.collective || {};
    const revenue = statsData.revenue || {};

    // Конвертируем atomic units в XMR
    const confirmedBalance = atomicToXMR(revenue.confirmedBalance || 0);
    const payoutThreshold = atomicToXMR(revenue.payoutThreshold || 0);
    const dailyCredited = atomicToXMR(revenue.dailyCredited || 0);

    // Средний хешрейт за 24 часа
    const avg24h = collective.avg24hashRate || 0;

    // Определяем дату последней выплаты
    let lastWithdrawal = 'Нет данных';
    if (paymentsData && paymentsData.length > 0) {
      const lastPayment = paymentsData[0]; // Первая выплата - самая свежая
      if (lastPayment.ts) {
        lastWithdrawal = formatDateDDMMYYYY(lastPayment.ts);
      }
    }

    // Собираем все даты выплат для календаря
    const payoutDates: string[] = [];
    if (Array.isArray(paymentsData)) {
      for (const payment of paymentsData) {
        if (payment.ts) {
          const dateStr = formatDateYYYYMMDD(payment.ts);
          payoutDates.push(dateStr);
        }
      }
    }

    // Формируем результат
    return {
      revenue: {
        lastWithdrawal,
        confirmedBalance,
        payoutThreshold,
        today: dailyCredited
      },
      hashrate: {
        avg24h
      },
      payoutDates
    };
  } catch (error) {
    console.error('Ошибка получения статистики HashVault:', error);
    return null;
  }
}
