// Парсеры для работы с MEXC API (криптовалютная биржа)
import { CryptoRate, CurrencyRate } from './types';

/**
 * Преобразует timestamp в формат YYYY-MM-DD
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получает текущий курс XMR/USDT с биржи MEXC
 */
export async function getXmrUsdtRate(): Promise<CryptoRate | null> {
  const url = 'https://api.mexc.com/api/v3/ticker/24hr?symbol=XMRUSDT';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      price: parseFloat(data.lastPrice),
      timestamp: Date.now(),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent)
    };
  } catch (error) {
    console.error('Ошибка получения курса XMR/USDT:', error);
    return null;
  }
}

/**
 * Получает историю курса XMR/USDT за указанное количество дней
 * @param days - количество дней истории (по умолчанию 30)
 */
export async function getXmrUsdtHistory(days: number = 30): Promise<CurrencyRate[]> {
  // MEXC API: интервал 1d (1 день), limit = количество дней
  const url = `https://api.mexc.com/api/v3/klines?symbol=XMRUSDT&interval=1d&limit=${days}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Неожиданный формат данных от MEXC API');
      return [];
    }

    const records: CurrencyRate[] = [];

    for (const candle of data) {
      // Формат свечи: [timestamp, open, high, low, close, volume, ...]
      // timestamp в миллисекундах
      const timestamp = parseInt(candle[0]);
      const openPrice = parseFloat(candle[1]);
      const closePrice = parseFloat(candle[4]);

      // Вычисляем изменение за день
      const change = closePrice - openPrice;
      const changePercent = openPrice > 0 ? (change / openPrice) * 100 : 0;

      records.push({
        date: formatDate(timestamp),
        value: closePrice,
        change,
        changePercent
      });
    }

    // Данные уже приходят в хронологическом порядке (от старых к новым)
    return records;
  } catch (error) {
    console.error('Ошибка получения истории XMR/USDT:', error);
    return [];
  }
}
