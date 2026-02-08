import { NextResponse } from 'next/server';
import { getXmrUsdtRate } from '@/lib/parsers/mexc';

export async function GET() {
  try {
    const rate = await getXmrUsdtRate();

    if (!rate) {
      return NextResponse.json(
        { error: 'Не удалось получить курс XMR' },
        { status: 500 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Ошибка в API /financial/xmr-rate:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
