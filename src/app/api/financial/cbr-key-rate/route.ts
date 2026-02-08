/**
 * @file API-маршрут для получения текущей ключевой ставки ЦБ РФ
 * @description Возвращает актуальную ключевую ставку Центрального Банка России.
 * Данные парсятся из HTML-страницы ЦБ РФ (таблица с историей ставок).
 * Ключевая ставка — основной инструмент денежно-кредитной политики ЦБ.
 *
 * Эндпоинт: /api/financial/cbr-key-rate
 * Методы: GET
 */

import { NextResponse } from 'next/server';
import { getCbrKeyRate } from '@/lib/parsers/cbr';

/**
 * Получает текущую ключевую ставку ЦБ РФ.
 *
 * Вызывает парсер, который:
 * 1. Загружает HTML-страницу с историей ключевой ставки
 * 2. Извлекает данные из таблицы через регулярные выражения
 * 3. Берет первую (самую свежую) запись
 * 4. Конвертирует русский формат числа (запятая → точка)
 *
 * @returns {Promise<NextResponse>} Объект KeyRate { rate, date } или ошибка 500
 */
export async function GET() {
  try {
    // Получаем текущую ключевую ставку через парсер ЦБ РФ
    const rate = await getCbrKeyRate();

    // Проверяем, что парсер вернул результат (может быть null при ошибке парсинга HTML)
    if (!rate) {
      return NextResponse.json(
        { error: 'Не удалось получить ключевую ставку ЦБ РФ' },
        { status: 500 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Ошибка в API /financial/cbr-key-rate:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
