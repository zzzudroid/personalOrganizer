import { NextResponse } from 'next/server';
import { getCbrKeyRate } from '@/lib/parsers/cbr';

export async function GET() {
  try {
    const rate = await getCbrKeyRate();

    if (!rate) {
      return NextResponse.json(
        { error: 'Не удалось получить ключевую ставку ЦБ РФ' },
        { status: 500 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Ошибка в API /financial/cbr-key-rate:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
