/**
 * @file API-маршрут для получения текущего курса Monero (XMR)
 * @description Возвращает актуальный курс XMR/USDT с криптобиржи MEXC.
 * Данные получаются в реальном времени через публичный REST API MEXC (без аутентификации).
 * Включает информацию об изменении цены за последние 24 часа.
 *
 * Эндпоинт: /api/financial/xmr-rate
 * Методы: GET
 */

import { NextResponse } from 'next/server';
import { getXmrUsdtRate } from '@/lib/parsers/mexc';

/**
 * Получает текущий курс Monero к USDT с биржи MEXC.
 *
 * Вызывает парсер MEXC, который запрашивает 24-часовой тикер
 * для торговой пары XMRUSDT и возвращает:
 * - price: текущая цена
 * - change24h: абсолютное изменение за 24 часа
 * - changePercent24h: процентное изменение за 24 часа
 * - timestamp: время получения данных
 *
 * @returns {Promise<NextResponse>} Объект CryptoRate или ошибка 500
 */
export async function GET() {
  try {
    // Получаем текущий курс через парсер MEXC
    const rate = await getXmrUsdtRate();

    // Проверяем, что парсер вернул результат (может быть null при ошибке API MEXC)
    if (!rate) {
      return NextResponse.json(
        { error: 'Не удалось получить курс XMR' },
        { status: 500 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Ошибка в API /financial/xmr-rate:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
