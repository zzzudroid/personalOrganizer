/**
 * @file Центральный модуль экспорта финансовых парсеров
 * @description Реэкспортирует все типы и функции парсеров из одного места.
 * Позволяет импортировать всё необходимое через один путь:
 *
 * @example
 * import { getUsdRate, CurrencyRate } from '@/lib/parsers';
 *
 * Структура парсеров:
 * - cbr.ts    — Центральный Банк России (курс USD, ключевая ставка)
 * - mexc.ts   — Криптобиржа MEXC (курс XMR/USDT)
 * - hashvault.ts — Пул майнинга HashVault (статистика Monero)
 * - types.ts  — TypeScript интерфейсы для всех парсеров
 */

// Экспорт типов (CurrencyRate, CryptoRate, MiningStats, KeyRate)
export * from './types';

// Экспорт парсеров ЦБ РФ (курс доллара, ключевая ставка и их история)
export {
  getUsdRate,
  getRateOnDate,
  getUsdRateHistory,
  getCbrKeyRate,
  getCbrKeyRateHistory
} from './cbr';

// Экспорт парсеров MEXC (курс Monero и история)
export {
  getXmrUsdtRate,
  getXmrUsdtHistory
} from './mexc';

// Экспорт парсера HashVault (статистика майнинга Monero)
export {
  getHashVaultStats
} from './hashvault';
