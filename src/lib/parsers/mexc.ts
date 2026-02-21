/**
 * @file Парсеры для работы с MEXC API (криптовалютная биржа)
 * @description Модуль для получения данных о курсе Monero (XMR) с биржи MEXC:
 * - Текущий курс XMR/USDT с изменением за 24 часа
 * - История курса XMR/USDT за указанный период (дневные свечи)
 *
 * Используется публичный REST API MEXC v3, не требующий аутентификации.
 * Базовый URL: https://api.mexc.com/api/v3
 *
 * Формат данных MEXC Klines (японские свечи):
 * [timestamp, open, high, low, close, volume, close_time, quote_volume, ...]
 * Индексы: [0]=timestamp, [1]=open, [2]=high, [3]=low, [4]=close, [5]=volume
 */

import { createHmac } from 'node:crypto';
import { CryptoRate, CurrencyRate, MexcSpotOrder } from './types';

/**
 * Преобразует Unix timestamp (в миллисекундах) в формат YYYY-MM-DD.
 * Используется для конвертации временных меток из MEXC API в ISO-подобный формат дат.
 *
 * @param timestamp - Unix timestamp в миллисекундах
 * @returns дата в формате "YYYY-MM-DD" (например, "2024-01-15")
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получает текущий курс XMR/USDT с биржи MEXC.
 *
 * Использует эндпоинт 24hr ticker, который возвращает:
 * - lastPrice: последняя цена сделки
 * - priceChange: абсолютное изменение цены за 24 часа
 * - priceChangePercent: процентное изменение за 24 часа
 *
 * Все значения приходят как строки и конвертируются в числа через parseFloat.
 *
 * @returns {Promise<CryptoRate | null>} Объект с текущей ценой и изменениями, или null при ошибке
 */
export async function getXmrUsdtRate(): Promise<CryptoRate | null> {
  // Эндпоинт 24-часового тикера для пары XMRUSDT
  const url = 'https://api.mexc.com/api/v3/ticker/24hr?symbol=XMRUSDT';

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Конвертируем строковые значения из API в числа
    return {
      price: parseFloat(data.lastPrice),               // Текущая цена
      timestamp: Date.now(),                             // Время запроса (локальное)
      change24h: parseFloat(data.priceChange),           // Абсолютное изменение за 24ч
      changePercent24h: parseFloat(data.priceChangePercent) // Процентное изменение за 24ч
    };
  } catch (error) {
    console.error('Ошибка получения курса XMR/USDT:', error);
    return null;
  }
}

/**
 * Получает историю курса XMR/USDT за указанное количество дней.
 *
 * Использует Klines API (японские свечи) с дневным интервалом.
 * Каждая свеча содержит данные за один торговый день.
 *
 * Формат одной свечи от MEXC:
 * [timestamp, open, high, low, close, volume, close_time, quote_volume, ...]
 *
 * Из свечи извлекаются:
 * - timestamp[0]: время открытия свечи (начало дня)
 * - open[1]: цена открытия
 * - close[4]: цена закрытия (используется как основное значение)
 * - Вычисляется изменение: close - open
 *
 * @param days - количество дней истории (по умолчанию 30), передается как limit в API
 * @returns {Promise<CurrencyRate[]>} Массив курсов в хронологическом порядке
 */
export async function getXmrUsdtHistory(days: number = 30): Promise<CurrencyRate[]> {
  // Klines API: interval=1d (дневные свечи), limit = количество свечей (дней)
  const url = `https://api.mexc.com/api/v3/klines?symbol=XMRUSDT&interval=1d&limit=${days}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Проверяем, что ответ — массив (MEXC может вернуть объект с ошибкой)
    if (!Array.isArray(data)) {
      console.error('Неожиданный формат данных от MEXC API');
      return [];
    }

    const records: CurrencyRate[] = [];

    for (const candle of data) {
      // Извлекаем данные из массива свечи по индексам:
      // [0] = timestamp (мс), [1] = open, [2] = high, [3] = low, [4] = close, [5] = volume
      const timestamp = parseInt(candle[0]);   // Время открытия свечи (мс)
      const openPrice = parseFloat(candle[1]);  // Цена открытия (начало дня)
      const closePrice = parseFloat(candle[4]); // Цена закрытия (конец дня)

      // Вычисляем дневное изменение цены (разница между закрытием и открытием)
      const change = closePrice - openPrice;
      // Процентное изменение с защитой от деления на ноль
      const changePercent = openPrice > 0 ? (change / openPrice) * 100 : 0;

      records.push({
        date: formatDate(timestamp), // timestamp (мс) → "YYYY-MM-DD"
        value: closePrice,            // Цена закрытия как основное значение
        change,                       // Абсолютное изменение за день
        changePercent                 // Процентное изменение за день
      });
    }

    // Данные от MEXC уже приходят в хронологическом порядке (от старых к новым)
    return records;
  } catch (error) {
    console.error('Ошибка получения истории XMR/USDT:', error);
    return [];
  }
}

interface MexcSpotOrderQueryParams {
  apiKey: string;
  apiSecret: string;
  symbol: string;
  orderId: string;
  recvWindow?: number;
}

interface MexcOpenOrdersQueryParams {
  apiKey: string;
  apiSecret: string;
  symbol?: string;
  recvWindow?: number;
}

interface MexcApiErrorResponse {
  code?: number;
  msg?: string;
}

interface MexcOrderResponse {
  symbol?: string;
  orderId?: number | string;
  id?: number | string;
  order_id?: number | string;
  orderNo?: number | string;
  clientOrderId?: string;
  origClientOrderId?: string;
  client_order_id?: string;
  price?: string;
  origQty?: string;
  quantity?: string;
  qty?: string;
  executedQty?: string;
  dealQuantity?: string;
  dealQty?: string;
  filledQty?: string;
  cummulativeQuoteQty?: string;
  cumulativeQuoteQty?: string;
  dealAmount?: string;
  status?: string;
  state?: string;
  type?: string;
  orderType?: string;
  side?: string;
  tradeType?: string;
  timeInForce?: string;
  tif?: string;
  isWorking?: boolean;
  time?: number | string;
  updateTime?: number | string;
  createTime?: number | string;
  [key: string]: unknown;
}

function toFiniteNumber(value: string | number | undefined): number {
  const parsed = typeof value === 'number' ? value : parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function toTimestamp(value: string | number | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value ?? '0', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function signQuery(params: URLSearchParams, apiSecret: string): string {
  return createHmac('sha256', apiSecret).update(params.toString()).digest('hex');
}

function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase();
}

function unwrapPayload<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    const data = (payload as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }

  return payload as T;
}

function extractOrderObject(payload: unknown): MexcOrderResponse | null {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return (payload[0] ?? null) as MexcOrderResponse | null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const obj = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    obj.data,
    obj.order,
    obj.result,
    obj.item,
    obj.record,
    obj.rows,
    obj.list,
    obj.items
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate)) {
      if (candidate.length > 0 && typeof candidate[0] === 'object') {
        return candidate[0] as MexcOrderResponse;
      }
      continue;
    }

    if (typeof candidate === 'object') {
      return candidate as MexcOrderResponse;
    }
  }

  return obj as MexcOrderResponse;
}

function extractOrderList(payload: unknown): MexcOrderResponse[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as MexcOrderResponse[];
  }

  if (typeof payload !== 'object') {
    return [];
  }

  const obj = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    obj.data,
    obj.orders,
    obj.result,
    obj.rows,
    obj.list,
    obj.items,
    obj.records
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as MexcOrderResponse[];
    }
  }

  const single = extractOrderObject(payload);
  return single ? [single] : [];
}

async function getMexcServerTimestamp(): Promise<number> {
  const response = await fetch('https://api.mexc.com/api/v3/time', { cache: 'no-store' });
  if (!response.ok) {
    return Date.now();
  }

  const payload = (await response.json()) as { serverTime?: number };
  return typeof payload.serverTime === 'number' ? payload.serverTime : Date.now();
}

function isRecvWindowError(errorBody: MexcApiErrorResponse | null): boolean {
  const msg = errorBody?.msg?.toLowerCase() ?? '';
  return msg.includes('outside of the recvwindow') || msg.includes('timestamp');
}

async function signedMexcRequest<T>(
  path: string,
  apiKey: string,
  apiSecret: string,
  queryParams: Record<string, string>,
  recvWindow: number
): Promise<T> {
  const execute = async (timestamp: number): Promise<{ ok: true; data: T } | { ok: false; error: MexcApiErrorResponse | null; status: number }> => {
    const params = new URLSearchParams({
      ...queryParams,
      recvWindow: String(recvWindow),
      timestamp: String(timestamp)
    });
    params.set('signature', signQuery(params, apiSecret));

    const url = `https://api.mexc.com/api/v3/${path}?${params.toString()}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'X-MEXC-APIKEY': apiKey
      }
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as MexcApiErrorResponse | null;
      return { ok: false, error: errorBody, status: response.status };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  };

  const firstTry = await execute(Date.now());
  if (firstTry.ok) {
    return firstTry.data;
  }

  if (isRecvWindowError(firstTry.error)) {
    const serverTimestamp = await getMexcServerTimestamp();
    const secondTry = await execute(serverTimestamp);
    if (secondTry.ok) {
      return secondTry.data;
    }

    const secondMsg = typeof secondTry.error?.msg === 'string' ? secondTry.error.msg : null;
    throw new Error(secondMsg ?? `MEXC API request failed with status ${secondTry.status}`);
  }

  const firstMsg = typeof firstTry.error?.msg === 'string' ? firstTry.error.msg : null;
  throw new Error(firstMsg ?? `MEXC API request failed with status ${firstTry.status}`);
}

function readOrderId(order: MexcOrderResponse): string {
  const value = order.orderId
    ?? order.id
    ?? order.order_id
    ?? order.orderNo
    ?? order.clientOrderId
    ?? order.origClientOrderId
    ?? order.client_order_id;
  if (value === undefined || value === null) {
    return '';
  }

  const id = String(value).trim();
  return id;
}

function mapMexcOrder(order: MexcOrderResponse, symbolFallback?: string): MexcSpotOrder | null {
  const orderId = readOrderId(order);
  if (!orderId) {
    return null;
  }

  return {
    symbol: order.symbol ?? symbolFallback ?? 'UNKNOWN',
    orderId,
    clientOrderId: order.clientOrderId ?? order.origClientOrderId ?? order.client_order_id ?? '-',
    price: toFiniteNumber(order.price),
    origQty: toFiniteNumber(order.origQty ?? order.quantity ?? order.qty),
    executedQty: toFiniteNumber(order.executedQty ?? order.dealQuantity ?? order.dealQty ?? order.filledQty),
    cummulativeQuoteQty: toFiniteNumber(order.cummulativeQuoteQty ?? order.cumulativeQuoteQty ?? order.dealAmount),
    status: order.status ?? order.state ?? 'UNKNOWN',
    type: order.type ?? order.orderType ?? 'UNKNOWN',
    side: order.side ?? order.tradeType ?? 'UNKNOWN',
    timeInForce: order.timeInForce ?? order.tif ?? 'UNKNOWN',
    isWorking: Boolean(order.isWorking),
    time: toTimestamp(order.time ?? order.createTime),
    updateTime: toTimestamp(order.updateTime ?? order.time ?? order.createTime)
  };
}

/**
 * Получает данные конкретного spot-ордера на MEXC по symbol + orderId.
 * Использует приватный эндпоинт /api/v3/order (SIGNED).
 */
export async function getMexcSpotOrder({
  apiKey,
  apiSecret,
  symbol,
  orderId,
  recvWindow = 60000
}: MexcSpotOrderQueryParams): Promise<MexcSpotOrder> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const normalizedOrderId = orderId.trim();

  if (!apiKey || !apiSecret) {
    throw new Error('MEXC API key/secret is not configured');
  }

  if (!normalizedSymbol || !normalizedOrderId) {
    throw new Error('symbol and orderId are required');
  }

  const payload = await signedMexcRequest<MexcOrderResponse | { data?: MexcOrderResponse }>(
    'order',
    apiKey,
    apiSecret,
    /^\d+$/.test(normalizedOrderId)
      ? {
          symbol: normalizedSymbol,
          orderId: normalizedOrderId
        }
      : {
          symbol: normalizedSymbol,
          origClientOrderId: normalizedOrderId
        },
    recvWindow
  );
  const order = extractOrderObject(unwrapPayload<unknown>(payload));
  if (!order) {
    throw new Error('MEXC order payload is empty');
  }
  const mappedOrder = mapMexcOrder(order, normalizedSymbol);

  if (!mappedOrder) {
    const keys = Object.keys(order).join(', ');
    throw new Error(`MEXC order payload missing required fields${keys ? ` (keys: ${keys})` : ''}`);
  }

  return mappedOrder;
}

/**
 * Получает все активные spot-ордера на MEXC.
 * Если symbol не передан, запрашивает ордера по всем парам.
 */
export async function getMexcOpenOrders({
  apiKey,
  apiSecret,
  symbol,
  recvWindow = 60000
}: MexcOpenOrdersQueryParams): Promise<MexcSpotOrder[]> {
  if (!apiKey || !apiSecret) {
    throw new Error('MEXC API key/secret is not configured');
  }

  const normalizedSymbol = symbol ? normalizeSymbol(symbol) : '';
  const payload = await signedMexcRequest<MexcOrderResponse[] | MexcOrderResponse | { data?: MexcOrderResponse[] | MexcOrderResponse }>(
    'openOrders',
    apiKey,
    apiSecret,
    normalizedSymbol ? { symbol: normalizedSymbol } : {},
    recvWindow
  );
  const orderList = extractOrderList(unwrapPayload<unknown>(payload));

  const mappedOrders = orderList
    .map((order) => mapMexcOrder(order, normalizedSymbol || undefined))
    .filter((order): order is MexcSpotOrder => order !== null);

  return mappedOrders.sort((a, b) => b.updateTime - a.updateTime);
}
