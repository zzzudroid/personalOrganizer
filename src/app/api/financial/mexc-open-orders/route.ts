import { NextResponse } from 'next/server';
import { getMexcOpenOrders } from '@/lib/parsers/mexc';

export const dynamic = 'force-dynamic';

function parseRecvWindow(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1000 || parsed > 60000) {
    return undefined;
  }

  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim().toUpperCase() ?? '';
  const recvWindow = parseRecvWindow(searchParams.get('recvWindow'));

  if (symbol && !/^[A-Z0-9]{4,20}$/.test(symbol)) {
    return NextResponse.json(
      { error: 'Некорректный формат symbol (пример: XMRUSDT)' },
      { status: 400 }
    );
  }

  const apiKey = process.env.MEXC_API_KEY;
  const apiSecret = process.env.MEXC_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'MEXC API ключи не настроены в переменных окружения' },
      { status: 500 }
    );
  }

  try {
    const orders = await getMexcOpenOrders({
      apiKey,
      apiSecret,
      symbol: symbol || undefined,
      recvWindow
    });

    return NextResponse.json(orders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось получить открытые ордера';

    console.error('Ошибка в API /financial/mexc-open-orders:', error);
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
