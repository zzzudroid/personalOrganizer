/**
 * @file API-маршрут для получения статистики майнинга Monero
 * @description Возвращает статистику майнинга с пула HashVault: хешрейт, баланс,
 * дневной доход и историю выплат. Данные получаются в реальном времени через
 * публичный API HashVault (требуется только адрес кошелька, не API-ключ).
 *
 * Адрес кошелька Monero берется из переменной окружения HASHVAULT_WALLET_ADDRESS.
 * Все суммы конвертируются из atomic units (piconero) в XMR (деление на 10^12).
 *
 * Эндпоинт: /api/financial/mining-stats
 * Методы: GET
 */

import { NextResponse } from 'next/server';
import { getHashVaultStats } from '@/lib/parsers/hashvault';

/** Отключаем кеширование — данные майнинга должны быть актуальными при каждом запросе */
export const dynamic = 'force-dynamic';

/**
 * Получает статистику майнинга Monero с пула HashVault.
 *
 * Выполняет два запроса к HashVault API:
 * 1. /stats — хешрейт и финансовая информация (баланс, порог выплаты, дневной доход)
 * 2. /payments — история выплат (для календаря выплат и даты последней выплаты)
 *
 * Требует настроенную переменную окружения HASHVAULT_WALLET_ADDRESS.
 * Без неё возвращает ошибку 500 с пояснительным сообщением.
 *
 * @returns {Promise<NextResponse>} Объект MiningStats или ошибка 500
 */
export async function GET() {
  try {
    // Получаем адрес кошелька Monero из переменных окружения
    const walletAddress = process.env.HASHVAULT_WALLET_ADDRESS;

    // Проверяем, что адрес кошелька настроен
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Адрес кошелька не настроен в переменных окружения' },
        { status: 500 }
      );
    }

    // Получаем статистику майнинга через парсер HashVault
    const stats = await getHashVaultStats(walletAddress);

    // Проверяем, что парсер вернул результат (может быть null при ошибке API HashVault)
    if (!stats) {
      return NextResponse.json(
        { error: 'Не удалось получить статистику майнинга' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Ошибка в API /financial/mining-stats:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
