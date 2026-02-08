// TypeScript типы для финансовых парсеров

export interface CurrencyRate {
  value: number;
  date: string; // YYYY-MM-DD
  change?: number;
  changePercent?: number;
}

export interface CryptoRate {
  price: number;
  timestamp: number;
  change24h: number;
  changePercent24h: number;
}

export interface MiningStats {
  revenue: {
    lastWithdrawal: string; // DD.MM.YYYY
    confirmedBalance: number; // XMR
    payoutThreshold: number; // XMR
    today: number; // XMR дневной доход
  };
  hashrate: {
    avg24h: number; // H/s средний хешрейт за 24 часа
  };
  payoutDates: string[]; // YYYY-MM-DD[] массив дат выплат
}

export interface KeyRate {
  rate: number;
  date: string; // YYYY-MM-DD
}
