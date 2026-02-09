import { Bot } from 'grammy';
import { getUsdRate, getCbrKeyRate } from '@/lib/parsers/cbr';
import { getXmrUsdtRate } from '@/lib/parsers/mexc';
import { getHashVaultStats } from '@/lib/parsers/hashvault';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN не задан в переменных окружения');
}

export const bot = new Bot(token);

/** Экранирование спецсимволов для MarkdownV2 */
function esc(text: string | number): string {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

bot.command('start', async (ctx) => {
  await ctx.reply(
    '📊 *Финансовая сводка*\n\n' +
    'Используй /stats для получения актуальных данных:\n' +
    '• Курс USD/RUB\n' +
    '• Курс XMR/USDT\n' +
    '• Ключевая ставка ЦБ\n' +
    '• Статистика майнинга',
    { parse_mode: 'MarkdownV2' }
  );
});

bot.command('stats', async (ctx) => {
  await ctx.reply('⏳ Загружаю данные\\.\\.\\.');

  const walletAddress = process.env.HASHVAULT_WALLET_ADDRESS || '';

  const [usdRate, xmrRate, keyRate, mining] = await Promise.allSettled([
    getUsdRate(),
    getXmrUsdtRate(),
    getCbrKeyRate(),
    walletAddress ? getHashVaultStats(walletAddress) : Promise.resolve(null),
  ]);

  const lines: string[] = ['📊 *Финансовая сводка*', ''];

  // USD/RUB
  if (usdRate.status === 'fulfilled' && usdRate.value) {
    lines.push(`💵 *USD/RUB:* ${esc(usdRate.value.value.toFixed(2))}`);
  } else {
    lines.push('💵 *USD/RUB:* нет данных');
  }

  // XMR/USDT
  if (xmrRate.status === 'fulfilled' && xmrRate.value) {
    const { price, changePercent24h } = xmrRate.value;
    const arrow = changePercent24h >= 0 ? '▲' : '▼';
    const sign = changePercent24h >= 0 ? '+' : '';
    lines.push(
      `🪙 *XMR/USDT:* ${esc(price.toFixed(2))} \\(${esc(arrow)} ${esc(sign + changePercent24h.toFixed(2))}%\\)`
    );
  } else {
    lines.push('🪙 *XMR/USDT:* нет данных');
  }

  // Ключевая ставка ЦБ
  if (keyRate.status === 'fulfilled' && keyRate.value) {
    lines.push(`🏦 *Ставка ЦБ:* ${esc(keyRate.value.rate.toFixed(1))}%`);
  } else {
    lines.push('🏦 *Ставка ЦБ:* нет данных');
  }

  // Майнинг
  if (mining.status === 'fulfilled' && mining.value) {
    const { revenue, hashrate } = mining.value;
    const progress = revenue.payoutThreshold > 0
      ? Math.min((revenue.confirmedBalance / revenue.payoutThreshold) * 100, 100)
      : 0;

    lines.push('');
    lines.push(`⛏ *Майнинг XMR*`);
    lines.push(`Последняя выплата: ${esc(revenue.lastWithdrawal)}`);
    lines.push(`До следующей: ${esc(progress.toFixed(1))}%`);
    lines.push(`Хешрейт \\(24ч\\): ${esc(hashrate.avg24h.toFixed(0))} H/s`);
  } else if (walletAddress) {
    lines.push('');
    lines.push('⛏ *Майнинг XMR:* нет данных');
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'MarkdownV2' });
});
