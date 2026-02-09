/**
 * Скрипт установки Telegram webhook.
 * Запуск: npx tsx scripts/set-telegram-webhook.ts https://your-domain.vercel.app
 */

const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error('Использование: npx tsx scripts/set-telegram-webhook.ts <BASE_URL>');
  console.error('Пример: npx tsx scripts/set-telegram-webhook.ts https://personal-organizer-gamma.vercel.app');
  process.exit(1);
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не задан. Добавь его в .env');
  process.exit(1);
}

const webhookUrl = `${baseUrl}/api/telegram/webhook`;

async function setWebhook() {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    }
  );

  const data = await response.json();
  console.log('Webhook URL:', webhookUrl);
  console.log('Ответ Telegram:', JSON.stringify(data, null, 2));

  if (data.ok) {
    console.log('Webhook успешно установлен!');
  } else {
    console.error('Ошибка установки webhook');
    process.exit(1);
  }
}

setWebhook();
