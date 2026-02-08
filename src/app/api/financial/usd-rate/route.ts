/**
 * @file API-маршрут для получения текущего курса доллара США
 * @description Возвращает актуальный курс USD/RUB от Центрального Банка России.
 * Данные получаются в реальном времени через XML API ЦБ РФ (не кэшируются в БД).
 * Парсинг XML выполняется в модуле cbr.ts с учетом кодировки windows-1251.
 *
 * Эндпоинт: /api/financial/usd-rate
 * Методы: GET
 */

import { NextResponse } from 'next/server';
import { getUsdRate } from '@/lib/parsers/cbr';

/**
 * Получает текущий курс доллара США к российскому рублю.
 *
 * Вызывает парсер ЦБ РФ, который:
 * 1. Загружает XML с ежедневными курсами валют
 * 2. Декодирует из windows-1251 в UTF-8
 * 3. Парсит XML и находит запись с CharCode = "USD"
 * 4. Конвертирует русский формат числа (запятая → точка)
 *
 * @returns {Promise<NextResponse>} Объект CurrencyRate { value, date } или ошибка 500
 */
export async function GET() {
  try {
    // Получаем текущий курс через парсер ЦБ РФ
    const rate = await getUsdRate();

    // Проверяем, что парсер вернул результат (может быть null при ошибке API ЦБ)
    if (!rate) {
      return NextResponse.json(
        { error: 'Не удалось получить курс USD' },
        { status: 500 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Ошибка в API /financial/usd-rate:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
