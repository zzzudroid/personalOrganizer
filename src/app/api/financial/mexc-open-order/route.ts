import { NextResponse } from 'next/server';
import { getMexcSpotOrder } from '@/lib/parsers/mexc';

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
  const orderId = searchParams.get('orderId')?.trim() ?? '';
  const recvWindow = parseRecvWindow(searchParams.get('recvWindow'));

  if (!symbol || !orderId) {
    return NextResponse.json(
      { error: 'Параметры symbol и orderId обязательны' },
      { status: 400 }
    );
  }

  if (!/^[A-Z0-9]{4,20}$/.test(symbol)) {
    return NextResponse.json(
      { error: 'Некорректный формат symbol (пример: XMRUSDT)' },
      { status: 400 }
    );
  }

  if (!/^[A-Za-z0-9_-]{2,128}$/.test(orderId)) {
    return NextResponse.json(
      { error: 'orderId содержит недопустимые символы' },
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
    const order = await getMexcSpotOrder({
      apiKey,
      apiSecret,
      symbol,
      orderId,
      recvWindow
    });

    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось получить ордер';

    console.error('Ошибка в API /financial/mexc-open-order:', error);
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
