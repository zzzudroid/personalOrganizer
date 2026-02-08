import { NextResponse } from 'next/server';
import { getHashVaultStats } from '@/lib/parsers/hashvault';

export async function GET() {
  try {
    const walletAddress = process.env.HASHVAULT_WALLET_ADDRESS;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Адрес кошелька не настроен в переменных окружения' },
        { status: 500 }
      );
    }

    const stats = await getHashVaultStats(walletAddress);

    if (!stats) {
      return NextResponse.json(
        { error: 'Не удалось получить статистику майнинга' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Ошибка в API /financial/mining-stats:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
