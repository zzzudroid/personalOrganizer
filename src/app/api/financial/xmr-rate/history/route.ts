/**
 * @file API-маршрут для получения истории курса Monero (XMR)
 * @description Возвращает историю курса XMR/USDT за указанное количество дней.
 * Данные получаются через MEXC Klines API (японские свечи с интервалом 1 день).
 * Используется для построения графика цены Monero на финансовом дашборде.
 *
 * Эндпоинт: /api/financial/xmr-rate/history?days=30
 * Методы: GET
 * Параметры запроса:
 *   - days (number, опционально, по умолчанию 30): количество дней истории
 */

import { NextResponse } from 'next/server';
import { getXmrUsdtHistory } from '@/lib/parsers/mexc';

/**
 * Получает историю курса Monero за указанный период.
 *
 * Принимает параметр запроса `days` для указания глубины истории.
 * По умолчанию возвращает данные за последние 30 дней.
 *
 * Данные от MEXC API приходят в формате свечей (OHLCV):
 * [timestamp, open, high, low, close, volume, ...]
 * Парсер извлекает цену закрытия (close) и вычисляет дневное изменение.
 *
 * @param {Request} request - входящий HTTP-запрос с query-параметром days
 * @returns {Promise<NextResponse>} JSON-массив CurrencyRate[] или ошибка 400/500
 */
export async function GET(request: Request) {
  try {
    // Извлекаем параметр days из строки запроса
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30; // По умолчанию 30 дней

    // Валидация параметра days: должен быть положительным числом
    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: 'Параметр days должен быть положительным числом' },
        { status: 400 }
      );
    }

    // Получаем историю курса через парсер MEXC
    const history = await getXmrUsdtHistory(days);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Ошибка в API /financial/xmr-rate/history:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
