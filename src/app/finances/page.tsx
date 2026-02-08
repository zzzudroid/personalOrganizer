"use client";

import CurrencyPanel from '@/components/Dashboard/CurrencyPanel';
import MiningPanel from '@/components/Dashboard/MiningPanel';

export default function FinancesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Заголовок */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Финансовый Dashboard</h1>
        <p className="text-gray-600">
          Отслеживание курсов валют, криптовалюты и статистики майнинга
        </p>
      </div>

      {/* Grid панелей */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Курс USD/RUB */}
        <CurrencyPanel
          title="USD/RUB"
          source="Центральный Банк России"
          endpoint="/api/financial/usd-rate"
          color="#667eea"
        />

        {/* Курс XMR/USDT */}
        <CurrencyPanel
          title="XMR/USDT"
          source="MEXC Exchange"
          endpoint="/api/financial/xmr-rate"
          color="#ff6b35"
        />

        {/* Статистика майнинга */}
        <MiningPanel />

        {/* Ключевая ставка ЦБ РФ */}
        <CurrencyPanel
          title="Ключевая ставка ЦБ РФ"
          source="Центральный Банк России"
          endpoint="/api/financial/cbr-key-rate"
          color="#3498db"
          isKeyRate={true}
        />
      </div>
    </div>
  );
}
