// Экспорт всех парсеров для финансовых данных

// Экспорт типов
export * from './types';

// Экспорт парсеров ЦБ РФ
export {
  getUsdRate,
  getRateOnDate,
  getUsdRateHistory,
  getCbrKeyRate,
  getCbrKeyRateHistory
} from './cbr';

// Экспорт парсеров MEXC
export {
  getXmrUsdtRate,
  getXmrUsdtHistory
} from './mexc';

// Экспорт парсера HashVault
export {
  getHashVaultStats
} from './hashvault';
