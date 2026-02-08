import { NextResponse } from 'next/server';
import { getUsdRate } from '@/lib/parsers/cbr';

export async function GET() {
  try {
    const rate = await getUsdRate();

    if (!rate) {
      return NextResponse.json(
        { error: 'Не удалось получить курс USD' },
        { status: 500 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Ошибка в API /financial/usd-rate:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
