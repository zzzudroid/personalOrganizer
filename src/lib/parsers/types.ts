/**
 * @file TypeScript типы для финансовых парсеров
 * @description Определяет интерфейсы данных, возвращаемых парсерами финансовых API.
 * Используется во всех парсерах (cbr.ts, mexc.ts, hashvault.ts) и API-маршрутах
 * финансового дашборда для обеспечения типобезопасности.
 */

/**
 * Курс фиатной валюты (например, USD/RUB от ЦБ РФ).
 * Используется для текущего курса и исторических данных.
 */
export interface CurrencyRate {
  /** Значение курса (например, 91.5 для USD/RUB) */
  value: number;
  /** Дата курса в формате YYYY-MM-DD (ISO-подобный формат для удобства сортировки) */
  date: string; // YYYY-MM-DD
  /** Абсолютное изменение курса за период (опционально, для истории) */
  change?: number;
  /** Процентное изменение курса за период (опционально, для истории) */
  changePercent?: number;
}

/**
 * Курс криптовалюты (например, XMR/USDT с биржи MEXC).
 * Включает данные об изменении за 24 часа для отображения динамики.
 */
export interface CryptoRate {
  /** Текущая цена в USDT */
  price: number;
  /** Временная метка получения данных (Unix timestamp в миллисекундах) */
  timestamp: number;
  /** Абсолютное изменение цены за последние 24 часа */
  change24h: number;
  /** Процентное изменение цены за последние 24 часа */
  changePercent24h: number;
}

/**
 * Статистика майнинга Monero с пула HashVault.
 * Объединяет данные о доходе, хешрейте и выплатах.
 */
export interface MiningStats {
  /** Информация о доходах и балансе */
  revenue: {
    /** Дата последней выплаты в формате DD.MM.YYYY (или "Нет данных") */
    lastWithdrawal: string; // DD.MM.YYYY
    /** Подтвержденный баланс на пуле (в XMR, не atomic units) */
    confirmedBalance: number; // XMR
    /** Порог автоматической выплаты (в XMR) */
    payoutThreshold: number; // XMR
    /** Начисленный доход за сегодня (в XMR) */
    today: number; // XMR дневной доход
  };
  /** Информация о хешрейте */
  hashrate: {
    /** Средний хешрейт за последние 24 часа (в H/s — хеш в секунду) */
    avg24h: number; // H/s средний хешрейт за 24 часа
  };
  /** Массив дат выплат в формате YYYY-MM-DD для отображения в календаре выплат */
  payoutDates: string[]; // YYYY-MM-DD[] массив дат выплат
}

/**
 * Ключевая ставка ЦБ РФ.
 * Используется для текущего значения и истории изменений.
 */
export interface KeyRate {
  /** Значение ставки в процентах годовых (например, 16.0) */
  rate: number;
  /** Дата установления ставки в формате YYYY-MM-DD */
  date: string; // YYYY-MM-DD
}

/**
 * Spot-ордер на бирже MEXC.
 * Используется для мониторинга конкретного ордера через приватный API.
 */
export interface MexcSpotOrder {
  /** Торговая пара (например, XMRUSDT) */
  symbol: string;
  /** ID ордера от биржи (храним как строку, чтобы не терять точность) */
  orderId: string;
  /** Клиентский ID ордера */
  clientOrderId: string;
  /** Цена ордера */
  price: number;
  /** Изначальный объем ордера */
  origQty: number;
  /** Исполненный объем */
  executedQty: number;
  /** Исполненная стоимость в quote-валюте */
  cummulativeQuoteQty: number;
  /** Статус ордера (NEW, PARTIALLY_FILLED, FILLED, CANCELED, и т.д.) */
  status: string;
  /** Тип ордера (LIMIT, MARKET и т.д.) */
  type: string;
  /** Сторона ордера (BUY/SELL) */
  side: string;
  /** Политика исполнения */
  timeInForce: string;
  /** Сервисный флаг биржи */
  isWorking: boolean;
  /** Время создания ордера (timestamp в мс) */
  time: number;
  /** Время последнего обновления ордера (timestamp в мс) */
  updateTime: number;
}
