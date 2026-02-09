/**
 * @file API-маршрут для получения истории курса доллара США
 * @description Возвращает историю курса USD/RUB за указанное количество дней.
 * Данные получаются через XML API ЦБ РФ (динамические курсы валют).
 * Используется для построения графика изменения курса на финансовом дашборде.
 *
 * Эндпоинт: /api/financial/usd-rate/history?days=30
 * Методы: GET
 * Параметры запроса:
 *   - days (number, опционально, по умолчанию 30): количество дней истории
 */

import { NextResponse } from 'next/server';
import { getUsdRateHistory } from '@/lib/parsers/cbr';

export const dynamic = 'force-dynamic';

/**
 * Получает историю курса доллара за указанный период.
 *
 * Принимает параметр запроса `days` для указания глубины истории.
 * По умолчанию возвращает данные за последние 30 дней.
 * Валидирует параметр: days должен быть положительным числом.
 *
 * Данные возвращаются в хронологическом порядке (от старых к новым)
 * для корректного отображения на графике Chart.js.
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

    // Получаем историю курса через парсер ЦБ РФ
    const history = await getUsdRateHistory(days);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Ошибка в API /financial/usd-rate/history:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
