# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Organizer - персональный органайзер с календарем и управлением задачами. Это Next.js приложение с полной синхронизацией между устройствами через PostgreSQL и поддержкой PWA.

**Live Demo:** https://personal-organizer-gamma.vercel.app

## Commands

### Development
```bash
npm run dev          # Запуск dev сервера (localhost:3000)
npm run build        # Production сборка
npm run start        # Запуск production сервера
npm run lint         # ESLint проверка
```

### Database (Prisma)
```bash
npm run db:migrate   # Применить миграции (interactive)
npm run db:generate  # Сгенерировать Prisma клиент
npm run db:studio    # Открыть Prisma Studio GUI
npx prisma migrate deploy  # Применить миграции (production)
npx ts-node prisma/seed.ts # Заполнить начальными данными
```

### Initial Setup
```bash
npm install
# Настроить .env с DATABASE_URL из Neon
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev
```

## Architecture

### Technology Stack
- **Next.js 14** (App Router, НЕ версия 15.x)
- **React 18** (НЕ версия 19.x - Vercel блокирует из-за CVE)
- **TypeScript 5.7** (strict mode)
- **Tailwind CSS 4**
- **Prisma ORM** с PostgreSQL (Neon)
- **date-fns** для работы с датами (с русской локализацией)

### Data Flow Architecture

**ВАЖНО: Это не localStorage приложение - все данные в PostgreSQL!**

```
Components → API Routes → Prisma → PostgreSQL (Neon)
     ↑                                      ↓
     └──────────── fetch() ←─────────────────┘
```

1. **Client Components** (`"use client"`) - все интерактивные компоненты
2. **API Routes** (`src/app/api/`) - единственный способ работы с данными
3. **Prisma Client** (`src/lib/db.ts`) - кэшированный глобальный экземпляр
4. **PostgreSQL** - облачная БД на Neon с автоматической синхронизацией

### State Management Pattern

Компоненты используют **callback-based state synchronization** вместо глобального стейта:

```typescript
// Parent (page.tsx)
const [refreshKey, setRefreshKey] = useState(0);
const handleTasksChange = () => setRefreshKey(prev => prev + 1);

// Child components получают onTasksChange callback
<Calendar key={refreshKey} onDateSelect={...} />
<TaskList key={refreshKey} onTasksChange={handleTasksChange} />
<DayView onTaskChange={handleTasksChange} />
```

**Почему так:** Простая синхронизация между Calendar, TaskList и DayView без Redux/Context. При изменении задачи компонент вызывает callback → parent обновляет `refreshKey` → все компоненты с этим key перезагружаются.

### Database Schema (Prisma)

4 основные модели:

1. **Task** - основная задача
   - Имеет `sortOrder` для drag & drop
   - Опциональная `dueDate` (String в формате "yyyy-MM-dd")
   - Связь с Category (optional)
   - Связь 1-to-many с Subtask

2. **Category** - категории задач (Работа, Личное, и т.д.)
   - `color` - HEX цвет для отображения

3. **Subtask** - подзадачи (чеклист)
   - `completed` - Boolean статус
   - `sortOrder` для порядка в списке
   - Cascade delete при удалении родительской Task

4. **PushSubscription** - для web push уведомлений
   - Хранит endpoint и ключи шифрования

### Component Communication

**Parent → Child:** props (date, onClose, onTasksChange, etc.)
**Child → Parent:** callbacks (onTasksChange, onAddTask, onClose)
**Sibling → Sibling:** через parent state + key prop

```
page.tsx (State Management Hub)
  ├─ Calendar.tsx           - читает tasks, drag & drop между днями
  ├─ TaskList.tsx           - CRUD задач, drag & drop для порядка
  ├─ DayView.tsx (Modal)    - показывает задачи дня, CRUD
  │    └─ SubtaskList.tsx   - чеклист подзадач (в edit modal)
  └─ QuickAddTask.tsx       - быстрое создание задачи
```

### Drag & Drop System

**2 типа D&D реализованы:**

1. **Task ordering** (TaskList, DayView)
   - Drag task → change sortOrder
   - Update all affected tasks' sortOrder via batch PUT

2. **Date changes** (Calendar)
   - Drag task to another day → change dueDate
   - Single PUT request with new date

**Важно:** Используется нативный HTML5 Drag & Drop API (не библиотеки).

### API Endpoints Structure

```
/api/tasks
  GET     - получить все задачи (with relations)
  POST    - создать задачу

/api/tasks/[id]
  PUT     - обновить задачу (частичные обновления)
  DELETE  - удалить задачу

/api/tasks/[id]/subtasks
  POST    - создать подзадачу

/api/subtasks/[id]
  PUT     - обновить подзадачу
  DELETE  - удалить подзадачу

/api/categories
  GET     - получить все категории
  POST    - создать категорию

/api/push/...
  - subscribe, unsubscribe, vapid-public-key
```

**Все API роуты:** try-catch с console.error + NextResponse.json

### Date Handling

**Формат хранения:** String "yyyy-MM-dd" (НЕ Date объект!)

```typescript
// Конвертация для storage
const formatDateForStorage = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

// Сравнение дат
import { isSameDay } from "date-fns";
const dayTasks = tasks.filter(task =>
  task.dueDate && isSameDay(new Date(task.dueDate), date)
);

// Форматирование для UI (русская локаль)
import { ru } from "date-fns/locale";
format(date, "d MMMM yyyy", { locale: ru })
```

### PWA Implementation

- Service Worker в `public/sw.js`
- Manifest в `public/manifest.json`
- `next-pwa` в `next.config.js`
- Офлайн-режим с кэшированием
- Установка на телефон/десктоп

### Push Notifications

- Web Push API с VAPID ключами
- `PushNotificationManager.tsx` - управление подписками
- Backend использует `web-push` для отправки

## Code Style & Conventions

### Language Standards
- **UI**: Русский язык
- **Commits**: Русский, present tense, формат `feat:`, `fix:`, `refactor:`, `docs:`
- **Comments**: Русский

### TypeScript
- Strict mode - всегда явные типы
- `interface` для объектов, `type` для unions
- НИКОГДА `any` - используй `unknown` с type guards

### Component Structure
```typescript
"use client"; // Только для client components

import { useState } from "react";
import { format } from "date-fns";
import ComponentName from "@/components/ComponentName";
import { prisma } from "@/lib/db";

interface Props {
  date: Date;
  onClose: () => void;
}

export default function Component({ date, onClose }: Props) {
  const [state, setState] = useState<Type>(...);
  return <div className="...">{...}</div>;
}
```

### Prisma Patterns

```typescript
// ВСЕГДА include relations при необходимости
const tasks = await prisma.task.findMany({
  include: {
    category: true,
    subtasks: {
      orderBy: { sortOrder: "asc" },
    },
  },
  orderBy: { sortOrder: "asc" },
});

// Cascade delete настроен в schema
onDelete: Cascade  // для Subtask → Task
```

### Error Handling
```typescript
try {
  const data = await prisma.task.findMany();
  return NextResponse.json(data);
} catch (error) {
  console.error("Ошибка:", error);
  return NextResponse.json(
    { error: "Сообщение на русском" },
    { status: 500 }
  );
}
```

### Tailwind Styling
- Semantic colors: `bg-gray-50`, `text-blue-600`
- Responsive: `sm:`, `md:`, `lg:`
- Transitions: `transition-colors duration-200`
- Conditional: template literals

## Environment Setup

### Required Environment Variables
```env
DATABASE_URL="postgresql://user:password@host.neon.tech/db?sslmode=require"

# Опционально для push-уведомлений
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
```

### Vercel Deployment
1. Подключить GitHub репозиторий
2. Добавить Environment Variables (DATABASE_URL + VAPID ключи)
3. Deploy (автоматический build + migrate)

**Важно:**
- Next.js 14.x (НЕ 15.x)
- React 18.x (НЕ 19.x)
- PostgreSQL connection string из Neon

## Common Development Tasks

### Adding New Task Field
1. Update `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Update TypeScript interfaces в компонентах
4. Update API routes для нового поля
5. Update UI forms (CreateTaskButton, TaskList edit modal, etc.)

### Creating New Component with Data
1. Mark as `"use client"` если есть hooks
2. Fetch data via API routes (НЕ прямой Prisma в client)
3. Use `useState` + `useEffect` для loading state
4. Provide `onTasksChange` callback если модифицируешь данные

### Debugging Sync Issues
```bash
npx prisma studio  # Проверить что в БД
# Dev tools → Network → проверить API calls
# Console → проверить ошибки fetch
```

## Important Architectural Decisions

1. **Почему PostgreSQL вместо localStorage?**
   - Синхронизация между устройствами
   - Данные не пропадают при очистке браузера
   - Scalability для будущих фич

2. **Почему callback pattern вместо Context/Redux?**
   - Простота для маленького приложения
   - Меньше boilerplate
   - Явный data flow

3. **Почему dueDate - String а не Date?**
   - JSON serialization проще
   - Prisma schema не поддерживает Date-only (только DateTime)
   - Меньше timezone проблем

4. **Почему нет TypeScript strict null checks в некоторых местах?**
   - Legacy code - постепенно рефакторим
   - НО: новый код должен правильно обрабатывать null/undefined

## Financial Dashboard

### Overview

Интегрированный финансовый дашборд для мониторинга:
- **Курс USD/RUB** - ЦБ РФ (XML API)
- **XMR/USDT** - MEXC криптобиржа
- **Ключевая ставка ЦБ РФ** - история изменений
- **HashVault Mining** - статистика майнинга Monero + календарь выплат

**Важно:** Финансовые данные НЕ сохраняются в БД - только real-time API запросы!

### Architecture

```
Dashboard Components → /api/financial/* → External APIs
                    ↓
               Chart.js graphs
```

**Парсеры** (`src/lib/parsers/`):
- `cbr.ts` - ЦБ РФ XML API (windows-1251 encoding, comma→dot conversion)
- `mexc.ts` - MEXC REST API (XMR/USDT ticker и klines)
- `hashvault.ts` - HashVault public API (atomic units → XMR conversion)

**API Routes** (`src/app/api/financial/`):
```
GET /api/financial/usd-rate              - текущий курс USD
GET /api/financial/usd-rate/history      - история USD (?days=30)
GET /api/financial/xmr-rate              - текущий XMR/USDT
GET /api/financial/xmr-rate/history      - история XMR
GET /api/financial/cbr-key-rate          - текущая ставка ЦБ
GET /api/financial/cbr-key-rate/history  - история ставки
GET /api/financial/mining-stats          - HashVault статистика + выплаты
```

**Components** (`src/components/Dashboard/`):
- `CurrencyPanel.tsx` - универсальная панель (USD/XMR/Ставка) с графиками
- `MiningPanel.tsx` - специальная панель для HashVault
- `RateChart.tsx` - Chart.js обертка для линейных графиков
- `PayoutCalendar.tsx` - календарь выплат майнинга (grid 7x4)

**Page:** `/finances` - 2x2 grid layout с 4 панелями

### Key Technical Details

**CBR RF API:**
- Encoding: windows-1251 (требует TextDecoder)
- Формат дат: DD.MM.YYYY → конвертируется в YYYY-MM-DD
- Числа: запятая → точка (91,5 → 91.5)
- XML парсинг через xml2js

**MEXC API:**
- Base URL: `https://api.mexc.com/api/v3`
- No auth для публичных endpoints
- 24h ticker: `/ticker/24hr?symbol=XMRUSDT`
- Historical: `/klines?symbol=XMRUSDT&interval=1d&limit=N`

**HashVault API:**
- Base URL: `https://api.hashvault.pro/v3/monero`
- Public API (только wallet address, НЕ API key)
- Stats: `/wallet/{address}/stats?poolType=false`
- Payments: `/wallet/{address}/payments?poolType=false`
- **Важно:** Atomic units → XMR: делить на `1e12`
  ```typescript
  const xmr = atomicUnits / 1_000_000_000_000;
  ```

**Chart.js Configuration:**
```typescript
// ВАЖНО: Регистрация компонентов обязательна в v4!
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, LineController, Tooltip, Legend, Filler
);

// График конфигурация
{
  type: "line",
  options: {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } }, // плавные кривые
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  }
}
```

**Data Refresh:**
- ТОЛЬКО по кнопке "Обновить" (НЕТ auto-refresh)
- Loading state с spinner
- Error handling: красные блоки (`bg-red-100 border-2 border-red-500`)

### Environment Variables

```env
# Для майнинг статистики (обязательно!)
HASHVAULT_WALLET_ADDRESS="your_monero_wallet_address"
```

**Vercel Setup:**
1. Project Settings → Environment Variables
2. Добавить `HASHVAULT_WALLET_ADDRESS`
3. Redeploy

### Adding New Financial Data Source

1. Создать парсер в `src/lib/parsers/your-source.ts`
2. Экспортировать типы в `src/lib/parsers/types.ts`
3. Создать API route в `src/app/api/financial/your-endpoint/route.ts`
4. Использовать `CurrencyPanel` или создать новый компонент
5. Добавить в grid на `/finances` странице

## Future Development Roadmap

См. README.md "Дальнейшее развитие":
- Telegram бот для уведомлений
- Повторяющиеся задачи
- Темная тема
- Экспорт/импорт данных
