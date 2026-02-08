# Финансовые парсеры

Модули для получения финансовых данных из различных API.

## Структура

- `types.ts` - TypeScript типы для всех парсеров
- `cbr.ts` - парсеры для API Центрального Банка России
- `mexc.ts` - парсеры для MEXC API (криптовалютная биржа)
- `hashvault.ts` - парсер для HashVault API (пул майнинга Monero)
- `index.ts` - экспорт всех парсеров

## Использование

### Импорт

```typescript
import {
  getUsdRate,
  getUsdRateHistory,
  getCbrKeyRate,
  getCbrKeyRateHistory,
  getXmrUsdtRate,
  getXmrUsdtHistory,
  getHashVaultStats
} from '@/lib/parsers';
```

### Примеры

#### Получение текущего курса USD/RUB

```typescript
const usdRate = await getUsdRate();
// { value: 95.5432, date: '2026-02-08' }
```

#### История курса USD/RUB за 30 дней

```typescript
const history = await getUsdRateHistory(30);
// [
//   { date: '2026-01-09', value: 94.1234 },
//   { date: '2026-01-10', value: 94.5678 },
//   ...
// ]
```

#### Получение ключевой ставки ЦБ РФ

```typescript
const keyRate = await getCbrKeyRate();
// { rate: 16.0, date: '2026-02-04' }
```

#### История ключевой ставки за 90 дней

```typescript
const keyRateHistory = await getCbrKeyRateHistory(90);
// [
//   { rate: 15.0, date: '2025-11-05' },
//   { rate: 16.0, date: '2026-02-04' },
//   ...
// ]
```

#### Получение курса XMR/USDT

```typescript
const xmrRate = await getXmrUsdtRate();
// {
//   price: 156.78,
//   timestamp: 1707408000000,
//   change24h: 2.34,
//   changePercent24h: 1.52
// }
```

#### История курса XMR/USDT за 30 дней

```typescript
const xmrHistory = await getXmrUsdtHistory(30);
// [
//   { date: '2026-01-09', value: 154.32, change: -1.23, changePercent: -0.8 },
//   { date: '2026-01-10', value: 156.78, change: 2.46, changePercent: 1.59 },
//   ...
// ]
```

#### Получение статистики майнинга HashVault

```typescript
const walletAddress = process.env.HASHVAULT_WALLET_ADDRESS;
const stats = await getHashVaultStats(walletAddress);
// {
//   revenue: {
//     lastWithdrawal: '05.02.2026',
//     confirmedBalance: 0.123456,
//     payoutThreshold: 0.1,
//     today: 0.00234
//   },
//   hashrate: {
//     avg24h: 12345.67
//   },
//   payoutDates: ['2026-02-05', '2026-01-28', ...]
// }
```

## API Endpoints

Пример использования в Next.js API route:

```typescript
// src/app/api/finance/route.ts
import { NextResponse } from 'next/server';
import { getUsdRate, getXmrUsdtRate } from '@/lib/parsers';

export async function GET() {
  const [usdRate, xmrRate] = await Promise.all([
    getUsdRate(),
    getXmrUsdtRate()
  ]);

  return NextResponse.json({
    usd: usdRate,
    xmr: xmrRate
  });
}
```

## Переменные окружения

Для работы парсера HashVault необходимо добавить в `.env.local`:

```env
HASHVAULT_WALLET_ADDRESS=ваш_адрес_monero_кошелька
```

## Зависимости

- `xml2js` - для парсинга XML от ЦБ РФ
- Native `fetch` API - для HTTP запросов
- Native `TextDecoder` - для обработки windows-1251 кодировки

## Особенности реализации

### ЦБ РФ (cbr.ts)

- **Кодировка**: XML данные в кодировке windows-1251
- **Формат дат**: DD.MM.YYYY преобразуется в YYYY-MM-DD
- **Числа**: запятые заменяются на точки (например, "95,5432" → 95.5432)
- **Курс USD**: код валюты R01235 в API ЦБ РФ

### MEXC (mexc.ts)

- **Формат времени**: timestamp в миллисекундах
- **Интервалы**: 1d для дневных свечей
- **Символ**: XMRUSDT для пары Monero/Tether

### HashVault (hashvault.ts)

- **Единицы измерения**: atomic units конвертируются в XMR (делятся на 10^12)
- **Timestamp**: время в секундах (не миллисекундах)
- **API версия**: v3
- **poolType**: false для персональной статистики

## Обработка ошибок

Все функции используют try-catch и возвращают:
- `null` при единичном значении в случае ошибки
- `[]` (пустой массив) для исторических данных в случае ошибки
- Ошибки логируются в консоль с помощью `console.error()`

## TypeScript типы

См. `types.ts` для полного списка интерфейсов:
- `CurrencyRate` - курсы валют
- `CryptoRate` - курсы криптовалют
- `MiningStats` - статистика майнинга
- `KeyRate` - ключевая ставка ЦБ РФ
