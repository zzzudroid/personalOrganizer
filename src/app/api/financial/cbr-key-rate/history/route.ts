/**
 * @file API-маршрут для получения истории ключевой ставки ЦБ РФ
 * @description Возвращает историю изменений ключевой ставки Центрального Банка России.
 * Данные парсятся из HTML-таблицы на сайте ЦБ РФ.
 * Используется для построения графика изменений ставки на финансовом дашборде.
 *
 * Важно: ключевая ставка меняется не ежедневно, а по решениям Совета директоров ЦБ РФ
 * (обычно 8 раз в год), поэтому параметр days ограничивает количество записей, а не дней.
 *
 * Эндпоинт: /api/financial/cbr-key-rate/history?days=90
 * Методы: GET
 * Параметры запроса:
 *   - days (number, опционально, по умолчанию 90): максимальное количество записей
 */

import { NextResponse } from 'next/server';
import { getCbrKeyRateHistory } from '@/lib/parsers/cbr';

export const dynamic = 'force-dynamic';

/**
 * Получает историю изменений ключевой ставки ЦБ РФ.
 *
 * Принимает параметр запроса `days` для ограничения количества записей.
 * По умолчанию возвращает до 90 последних записей.
 *
 * Данные возвращаются в хронологическом порядке (от старых к новым)
 * для корректного отображения на графике Chart.js.
 *
 * @param {Request} request - входящий HTTP-запрос с query-параметром days
 * @returns {Promise<NextResponse>} JSON-массив KeyRate[] или ошибка 400/500
 */
export async function GET(request: Request) {
  try {
    // Извлекаем параметр days из строки запроса
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 90; // По умолчанию 90 записей

    // Валидация параметра days: должен быть положительным числом
    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: 'Параметр days должен быть положительным числом' },
        { status: 400 }
      );
    }

    // Получаем историю ставки через парсер ЦБ РФ
    const history = await getCbrKeyRateHistory(days);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Ошибка в API /financial/cbr-key-rate/history:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
