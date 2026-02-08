"use client";

import CurrencyPanel from '@/components/Dashboard/CurrencyPanel';
import MiningPanel from '@/components/Dashboard/MiningPanel';

export default function FinancesPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Grid панелей */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Курс USD/RUB */}
        <CurrencyPanel
          title="USD/RUB"
          panelTitle="Доллар США"
          source="Центральный Банк России"
          endpoint="/api/financial/usd-rate"
          color="#a78bfa"
          icon="US"
          badge="ЦБ РФ"
          badgeColor="bg-purple-600 text-white"
          gradient="bg-gradient-to-br from-purple-600 to-indigo-700"
          unit="руб."
        />

        {/* Курс XMR/USDT */}
        <CurrencyPanel
          title="XMR/USDT"
          panelTitle="Monero"
          source="MEXC Exchange"
          endpoint="/api/financial/xmr-rate"
          color="#fb923c"
          icon="⛏"
          badge="MEXC"
          badgeColor="bg-orange-500 text-white"
          gradient="bg-gradient-to-br from-orange-500 to-amber-600"
          unit="USDT"
        />

        {/* Статистика майнинга */}
        <MiningPanel />

        {/* Ключевая ставка ЦБ РФ */}
        <CurrencyPanel
          title="Ключевая ставка"
          panelTitle="Ключевая ставка"
          source="Центральный Банк России"
          endpoint="/api/financial/cbr-key-rate"
          color="#facc15"
          icon="🏛"
          badge="ЦБ РФ"
          badgeColor="bg-blue-600 text-white"
          gradient="bg-gradient-to-br from-blue-600 to-blue-800"
          unit="% годовых"
          chartTitle="График изменений"
          isKeyRate={true}
        />
      </div>
    </div>
  );
}
