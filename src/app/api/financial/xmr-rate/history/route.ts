import { NextResponse } from 'next/server';
import { getXmrUsdtHistory } from '@/lib/parsers/mexc';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: 'Параметр days должен быть положительным числом' },
        { status: 400 }
      );
    }

    const history = await getXmrUsdtHistory(days);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Ошибка в API /financial/xmr-rate/history:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
