// Тестовый скрипт для проверки работы парсеров
// Запуск: npx tsx scripts/test-parsers.ts

import {
  getUsdRate,
  getUsdRateHistory,
  getCbrKeyRate,
  getCbrKeyRateHistory,
  getXmrUsdtRate,
  getXmrUsdtHistory,
  getHashVaultStats
} from '../src/lib/parsers';

async function testParsers() {
  console.log('=== Тестирование парсеров ===\n');

  // Тест 1: Текущий курс USD/RUB
  console.log('1. Получение текущего курса USD/RUB...');
  try {
    const usdRate = await getUsdRate();
    if (usdRate) {
      console.log(`   ✓ Курс: ${usdRate.value} руб., дата: ${usdRate.date}`);
    } else {
      console.log('   ✗ Не удалось получить курс USD');
    }
  } catch (error) {
    console.log(`   ✗ Ошибка: ${error}`);
  }

  console.log('');

  // Тест 2: История курса USD/RUB
  console.log('2. Получение истории курса USD/RUB за 7 дней...');
  try {
    const history = await getUsdRateHistory(7);
    if (history.length > 0) {
      console.log(`   ✓ Получено записей: ${history.length}`);
      console.log(`   Первая: ${history[0].date} - ${history[0].value} руб.`);
      console.log(`   Последняя: ${history[history.length - 1].date} - ${history[history.length - 1].value} руб.`);
    } else {
      console.log('   ✗ Не удалось получить историю');
    }
  } catch (error) {
    console.log(`   ✗ Ошибка: ${error}`);
  }

  console.log('');

  // Тест 3: Ключевая ставка ЦБ РФ
  console.log('3. Получение ключевой ставки ЦБ РФ...');
  try {
    const keyRate = await getCbrKeyRate();
    if (keyRate) {
      console.log(`   ✓ Ставка: ${keyRate.rate}%, дата: ${keyRate.date}`);
    } else {
      console.log('   ✗ Не удалось получить ключевую ставку');
    }
  } catch (error) {
    console.log(`   ✗ Ошибка: ${error}`);
  }

  console.log('');

  // Тест 4: История ключевой ставки
  console.log('4. Получение истории ключевой ставки (последние 5 изменений)...');
  try {
    const history = await getCbrKeyRateHistory(5);
    if (history.length > 0) {
      console.log(`   ✓ Получено записей: ${history.length}`);
      history.forEach((record) => {
        console.log(`   - ${record.date}: ${record.rate}%`);
      });
    } else {
      console.log('   ✗ Не удалось получить историю');
    }
  } catch (error) {
    console.log(`   ✗ Ошибка: ${error}`);
  }

  console.log('');

  // Тест 5: Курс XMR/USDT
  console.log('5. Получение курса XMR/USDT...');
  try {
    const xmrRate = await getXmrUsdtRate();
    if (xmrRate) {
      console.log(`   ✓ Цена: ${xmrRate.price} USDT`);
      console.log(`   Изменение за 24ч: ${xmrRate.changePercent24h.toFixed(2)}%`);
    } else {
      console.log('   ✗ Не удалось получить курс XMR');
    }
  } catch (error) {
    console.log(`   ✗ Ошибка: ${error}`);
  }

  console.log('');

  // Тест 6: История XMR/USDT
  console.log('6. Получение истории XMR/USDT за 7 дней...');
  try {
    const history = await getXmrUsdtHistory(7);
    if (history.length > 0) {
      console.log(`   ✓ Получено записей: ${history.length}`);
      console.log(`   Первая: ${history[0].date} - ${history[0].value} USDT`);
      console.log(`   Последняя: ${history[history.length - 1].date} - ${history[history.length - 1].value} USDT`);
    } else {
      console.log('   ✗ Не удалось получить историю');
    }
  } catch (error) {
    console.log(`   ✗ Ошибка: ${error}`);
  }

  console.log('');

  // Тест 7: HashVault статистика (требует HASHVAULT_WALLET_ADDRESS)
  console.log('7. Получение статистики HashVault...');
  const walletAddress = process.env.HASHVAULT_WALLET_ADDRESS;
  if (!walletAddress) {
    console.log('   ⊗ Пропущено: переменная окружения HASHVAULT_WALLET_ADDRESS не установлена');
  } else {
    try {
      const stats = await getHashVaultStats(walletAddress);
      if (stats) {
        console.log(`   ✓ Последняя выплата: ${stats.revenue.lastWithdrawal}`);
        console.log(`   Баланс: ${stats.revenue.confirmedBalance.toFixed(6)} XMR`);
        console.log(`   Дневной доход: ${stats.revenue.today.toFixed(6)} XMR`);
        console.log(`   Хешрейт 24ч: ${stats.hashrate.avg24h.toFixed(2)} H/s`);
        console.log(`   Дат выплат: ${stats.payoutDates.length}`);
      } else {
        console.log('   ✗ Не удалось получить статистику');
      }
    } catch (error) {
      console.log(`   ✗ Ошибка: ${error}`);
    }
  }

  console.log('\n=== Тестирование завершено ===');
}

// Запуск тестов
testParsers().catch(console.error);
