/**
 * @file Парсеры для работы с MEXC API (криптовалютная биржа)
 * @description Модуль для получения данных о курсе Monero (XMR) с биржи MEXC:
 * - Текущий курс XMR/USDT с изменением за 24 часа
 * - История курса XMR/USDT за указанный период (дневные свечи)
 *
 * Используется публичный REST API MEXC v3, не требующий аутентификации.
 * Базовый URL: https://api.mexc.com/api/v3
 *
 * Формат данных MEXC Klines (японские свечи):
 * [timestamp, open, high, low, close, volume, close_time, quote_volume, ...]
 * Индексы: [0]=timestamp, [1]=open, [2]=high, [3]=low, [4]=close, [5]=volume
 */

import { CryptoRate, CurrencyRate } from './types';

/**
 * Преобразует Unix timestamp (в миллисекундах) в формат YYYY-MM-DD.
 * Используется для конвертации временных меток из MEXC API в ISO-подобный формат дат.
 *
 * @param timestamp - Unix timestamp в миллисекундах
 * @returns дата в формате "YYYY-MM-DD" (например, "2024-01-15")
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получает текущий курс XMR/USDT с биржи MEXC.
 *
 * Использует эндпоинт 24hr ticker, который возвращает:
 * - lastPrice: последняя цена сделки
 * - priceChange: абсолютное изменение цены за 24 часа
 * - priceChangePercent: процентное изменение за 24 часа
 *
 * Все значения приходят как строки и конвертируются в числа через parseFloat.
 *
 * @returns {Promise<CryptoRate | null>} Объект с текущей ценой и изменениями, или null при ошибке
 */
export async function getXmrUsdtRate(): Promise<CryptoRate | null> {
  // Эндпоинт 24-часового тикера для пары XMRUSDT
  const url = 'https://api.mexc.com/api/v3/ticker/24hr?symbol=XMRUSDT';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Конвертируем строковые значения из API в числа
    return {
      price: parseFloat(data.lastPrice),               // Текущая цена
      timestamp: Date.now(),                             // Время запроса (локальное)
      change24h: parseFloat(data.priceChange),           // Абсолютное изменение за 24ч
      changePercent24h: parseFloat(data.priceChangePercent) // Процентное изменение за 24ч
    };
  } catch (error) {
    console.error('Ошибка получения курса XMR/USDT:', error);
    return null;
  }
}

/**
 * Получает историю курса XMR/USDT за указанное количество дней.
 *
 * Использует Klines API (японские свечи) с дневным интервалом.
 * Каждая свеча содержит данные за один торговый день.
 *
 * Формат одной свечи от MEXC:
 * [timestamp, open, high, low, close, volume, close_time, quote_volume, ...]
 *
 * Из свечи извлекаются:
 * - timestamp[0]: время открытия свечи (начало дня)
 * - open[1]: цена открытия
 * - close[4]: цена закрытия (используется как основное значение)
 * - Вычисляется изменение: close - open
 *
 * @param days - количество дней истории (по умолчанию 30), передается как limit в API
 * @returns {Promise<CurrencyRate[]>} Массив курсов в хронологическом порядке
 */
export async function getXmrUsdtHistory(days: number = 30): Promise<CurrencyRate[]> {
  // Klines API: interval=1d (дневные свечи), limit = количество свечей (дней)
  const url = `https://api.mexc.com/api/v3/klines?symbol=XMRUSDT&interval=1d&limit=${days}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Проверяем, что ответ — массив (MEXC может вернуть объект с ошибкой)
    if (!Array.isArray(data)) {
      console.error('Неожиданный формат данных от MEXC API');
      return [];
    }

    const records: CurrencyRate[] = [];

    for (const candle of data) {
      // Извлекаем данные из массива свечи по индексам:
      // [0] = timestamp (мс), [1] = open, [2] = high, [3] = low, [4] = close, [5] = volume
      const timestamp = parseInt(candle[0]);   // Время открытия свечи (мс)
      const openPrice = parseFloat(candle[1]);  // Цена открытия (начало дня)
      const closePrice = parseFloat(candle[4]); // Цена закрытия (конец дня)

      // Вычисляем дневное изменение цены (разница между закрытием и открытием)
      const change = closePrice - openPrice;
      // Процентное изменение с защитой от деления на ноль
      const changePercent = openPrice > 0 ? (change / openPrice) * 100 : 0;

      records.push({
        date: formatDate(timestamp), // timestamp (мс) → "YYYY-MM-DD"
        value: closePrice,            // Цена закрытия как основное значение
        change,                       // Абсолютное изменение за день
        changePercent                 // Процентное изменение за день
      });
    }

    // Данные от MEXC уже приходят в хронологическом порядке (от старых к новым)
    return records;
  } catch (error) {
    console.error('Ошибка получения истории XMR/USDT:', error);
    return [];
  }
}
