"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { MexcSpotOrder } from '@/lib/parsers/types';

const DEFAULT_SYMBOL = 'XMRUSDT';
const REFRESH_INTERVAL_MS = 15000;

const OPEN_STATUSES = new Set(['NEW', 'PARTIALLY_FILLED']);

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-emerald-600 text-white',
  PARTIALLY_FILLED: 'bg-yellow-500 text-black',
  FILLED: 'bg-blue-600 text-white',
  CANCELED: 'bg-red-600 text-white',
  REJECTED: 'bg-red-700 text-white',
  EXPIRED: 'bg-gray-600 text-white'
};

function formatNumber(value: number, maxFractionDigits: number = 8): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits
  });
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) {
    return '—';
  }

  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function MexcSpotOrderPanel() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [orderId, setOrderId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [order, setOrder] = useState<MexcSpotOrder | null>(null);

  useEffect(() => {
    const savedSymbol = localStorage.getItem('mexc_spot_symbol');
    const savedOrderId = localStorage.getItem('mexc_spot_order_id');
    if (savedSymbol) {
      setSymbol(savedSymbol);
    }
    if (savedOrderId) {
      setOrderId(savedOrderId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mexc_spot_symbol', symbol);
  }, [symbol]);

  useEffect(() => {
    localStorage.setItem('mexc_spot_order_id', orderId);
  }, [orderId]);

  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedOrderId = orderId.trim();
  const canQuery = useMemo(
    () => /^[A-Z0-9]{4,20}$/.test(normalizedSymbol) && /^\d+$/.test(normalizedOrderId),
    [normalizedOrderId, normalizedSymbol]
  );

  const fetchOrder = useCallback(async () => {
    if (!canQuery) {
      setError('Введите корректные symbol и orderId');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        symbol: normalizedSymbol,
        orderId: normalizedOrderId
      });
      const response = await fetch(`/api/financial/mexc-open-order?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${response.status}`);
      }

      setOrder(data as MexcSpotOrder);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить данные ордера');
    } finally {
      setLoading(false);
    }
  }, [canQuery, normalizedOrderId, normalizedSymbol]);

  useEffect(() => {
    if (!autoRefresh || !canQuery) {
      return;
    }

    fetchOrder();
    const intervalId = window.setInterval(fetchOrder, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [autoRefresh, canQuery, fetchOrder]);

  const statusClass = order ? STATUS_STYLES[order.status] ?? 'bg-gray-600 text-white' : 'bg-gray-600 text-white';
  const fillPercent = order && order.origQty > 0 ? Math.min((order.executedQty / order.origQty) * 100, 100) : 0;
  const remainingQty = order ? Math.max(order.origQty - order.executedQty, 0) : 0;
  const isOpen = order ? OPEN_STATUSES.has(order.status) : false;

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">📌</span>
          MEXC Spot ордер
        </h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-600 text-white">
          Private API
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          fetchOrder();
        }}
        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2"
      >
        <input
          type="text"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          placeholder="Пара (например, XMRUSDT)"
          className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-cyan-500"
        />
        <input
          type="text"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value.replace(/[^\d]/g, ''))}
          placeholder="Order ID"
          className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-500 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
            className="accent-cyan-500"
          />
          Автообновление каждые 15 сек
        </label>

        <button
          onClick={fetchOrder}
          disabled={loading || !canQuery}
          className="p-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
          title="Обновить сейчас"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {order && (
        <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">Статус:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}`}>
              {order.status}
            </span>
            <span className="text-xs text-gray-400">
              {isOpen ? 'Ордер активен' : 'Ордер не активен'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Пара</p>
              <p className="text-white font-semibold">{order.symbol}</p>
            </div>
            <div>
              <p className="text-gray-400">Сторона</p>
              <p className="text-white font-semibold">{order.side}</p>
            </div>
            <div>
              <p className="text-gray-400">Тип</p>
              <p className="text-white font-semibold">{order.type}</p>
            </div>
            <div>
              <p className="text-gray-400">Цена</p>
              <p className="text-white font-semibold">{formatNumber(order.price, 6)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">
                Исполнено: {formatNumber(order.executedQty)} / {formatNumber(order.origQty)}
              </span>
              <span className="text-white font-semibold">{fillPercent.toFixed(2)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Осталось: {formatNumber(remainingQty)} | Потрачено: {formatNumber(order.cummulativeQuoteQty, 6)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400">
            <p>Создан: {formatDateTime(order.time)}</p>
            <p>Обновлён: {formatDateTime(order.updateTime)}</p>
            <p className="md:col-span-2">Order ID: {order.orderId}</p>
            <p className="md:col-span-2">Client ID: {order.clientOrderId}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Последнее обновление: {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'ещё не выполнялось'}
      </p>
    </div>
  );
}
