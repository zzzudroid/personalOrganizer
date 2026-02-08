# Personal Organizer

Персональный органайзер с календарем, управлением задачами и финансовым дашбордом.

**Демо:** https://personal-organizer-gamma.vercel.app

---

## Что умеет приложение

### Календарь и задачи
- Интерактивный календарь с навигацией по месяцам
- Создание, редактирование и удаление задач
- Категории (Работа, Личное, Учеба, Здоровье) с цветовой маркировкой
- Приоритеты (низкий, средний, высокий)
- Статусы (к выполнению, в работе, выполнено)
- Подзадачи (чеклист) с прогресс-баром
- Drag & Drop — перетаскивание задач между днями и в списке

### Финансовый дашборд (`/finances`)
- Курс USD/RUB — данные ЦБ РФ с графиком за 30/60/90 дней
- Курс XMR/USDT — данные биржи MEXC с графиком
- Ключевая ставка ЦБ РФ — текущая и история изменений
- Статистика майнинга Monero — HashVault (хешрейт, баланс, календарь выплат)
- Тёмная тема с градиентными карточками

### Синхронизация и PWA
- Данные в облаке (PostgreSQL) — доступно с любого устройства
- PWA — установка как приложение на телефон/десктоп
- Push-уведомления о задачах
- Офлайн-режим с кэшированием

---

## Быстрый старт (для новичков)

### Что нужно заранее

1. **Node.js** (версия 18 или выше) — скачай с [nodejs.org](https://nodejs.org)
2. **Git** — скачай с [git-scm.com](https://git-scm.com)
3. **Редактор кода** — рекомендуем [VS Code](https://code.visualstudio.com)

Проверь что всё установлено:
```bash
node --version    # должно показать v18.x.x или выше
npm --version     # должно показать 9.x.x или выше
git --version     # должно показать git version x.x.x
```

### Шаг 1. Скачай проект

```bash
git clone https://github.com/zzzudroid/personalOrganizer.git
cd personalOrganizer
```

### Шаг 2. Установи зависимости

```bash
npm install
```
Эта команда скачает все библиотеки, которые нужны проекту. Займёт 1-2 минуты.

### Шаг 3. Настрой базу данных

Приложение хранит данные в облачной базе PostgreSQL. Бесплатный вариант — [Neon](https://neon.tech):

1. Зарегистрируйся на [neon.tech](https://neon.tech) (бесплатно)
2. Нажми **"Create Project"**, назови `personal-organizer`
3. Скопируй строку подключения — она начинается с `postgresql://...`
4. Создай файл `.env` в корне проекта:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"
```

**Замени строку на свою** из Neon (вся строка целиком).

### Шаг 4. Создай таблицы в базе

```bash
npx prisma migrate dev --name init
```
Эта команда создаст все нужные таблицы (задачи, категории, подзадачи).

### Шаг 5. Добавь начальные категории

```bash
npx ts-node prisma/seed.ts
```
Создаст категории: Работа, Личное, Учеба, Здоровье.

### Шаг 6. Запусти!

```bash
npm run dev
```

Открой в браузере: **http://localhost:3000**

- Главная страница — календарь и задачи
- **http://localhost:3000/finances** — финансовый дашборд

---

## Дополнительные настройки (необязательно)

### Push-уведомления

Для напоминаний о задачах нужны VAPID-ключи:

```bash
npx web-push generate-vapid-keys
```

Добавь в `.env`:
```env
VAPID_PUBLIC_KEY="скопируй_публичный_ключ"
VAPID_PRIVATE_KEY="скопируй_приватный_ключ"
```

### Статистика майнинга

Для панели HashVault добавь в `.env`:
```env
HASHVAULT_WALLET_ADDRESS="твой_адрес_monero_кошелька"
```

---

## Деплой на Vercel

1. Зайди на [vercel.com](https://vercel.com), войди через GitHub
2. Нажми **"Add New Project"** и выбери репозиторий `personalOrganizer`
3. Добавь переменные окружения:
   - `DATABASE_URL` — строка подключения из Neon
   - `VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY` — для push-уведомлений (опционально)
   - `HASHVAULT_WALLET_ADDRESS` — для майнинг-статистики (опционально)
4. Нажми **Deploy**

При каждом `git push` в main Vercel автоматически пересобирает и деплоит проект.

---

## Установка на телефон (PWA)

### Android (Chrome)
1. Открой сайт в Chrome
2. Нажми три точки (меню) → **"Установить приложение"**
3. Иконка появится на рабочем столе

### iPhone (Safari)
1. Открой сайт в Safari
2. Нажми **"Поделиться"** (квадрат со стрелкой) → **"На экран Домой"**
3. Нажми **"Добавить"**

### Windows / Mac (Chrome)
1. Открой сайт в Chrome
2. В адресной строке нажми значок установки → **"Установить"**

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev сервера (localhost:3000) |
| `npm run build` | Production сборка |
| `npm run start` | Запуск production сервера |
| `npm run lint` | Проверка кода ESLint |
| `npm run db:migrate` | Применить миграции БД |
| `npm run db:generate` | Сгенерировать Prisma клиент |
| `npm run db:studio` | Открыть GUI для базы данных |

---

## Стек технологий

| Технология | Назначение |
|------------|------------|
| Next.js 14 | React-фреймворк (App Router) |
| React 18 | Библиотека UI |
| TypeScript 5.7 | Типизация (strict mode) |
| Tailwind CSS 4 | Стилизация |
| Prisma 6 | ORM для работы с PostgreSQL |
| PostgreSQL (Neon) | Облачная база данных |
| Chart.js | Графики на финансовом дашборде |
| date-fns | Работа с датами (русская локаль) |
| lucide-react | Иконки |
| next-pwa | PWA поддержка |
| web-push | Push-уведомления |
| xml2js | Парсинг XML от ЦБ РФ |

---

## Структура проекта

```
personalOrganizer/
├── prisma/
│   ├── schema.prisma          # Схема базы данных (4 модели)
│   ├── seed.ts                # Начальные данные (категории)
│   └── migrations/            # Миграции БД
├── public/
│   ├── manifest.json          # PWA манифест
│   ├── sw.js                  # Service Worker (автогенерация)
│   └── icons/                 # Иконки приложения
├── src/
│   ├── app/
│   │   ├── page.tsx           # Главная — календарь и задачи
│   │   ├── finances/page.tsx  # Финансовый дашборд
│   │   ├── layout.tsx         # Корневой layout с навигацией
│   │   ├── globals.css        # Глобальные стили
│   │   └── api/               # API маршруты
│   │       ├── tasks/         # CRUD задач
│   │       ├── subtasks/      # CRUD подзадач
│   │       ├── categories/    # CRUD категорий
│   │       ├── push/          # Push-уведомления
│   │       └── financial/     # Финансовые данные
│   │           ├── usd-rate/          # Курс USD/RUB (ЦБ РФ)
│   │           ├── xmr-rate/          # Курс XMR/USDT (MEXC)
│   │           ├── cbr-key-rate/      # Ключевая ставка ЦБ
│   │           └── mining-stats/      # HashVault статистика
│   ├── components/
│   │   ├── Calendar.tsx       # Календарь с drag & drop
│   │   ├── TaskList.tsx       # Список задач с CRUD
│   │   ├── DayView.tsx        # Модальное окно дня
│   │   ├── SubtaskList.tsx    # Чеклист подзадач
│   │   ├── QuickAddTask.tsx   # Быстрое создание задачи
│   │   ├── CreateTaskButton.tsx # Кнопка создания задачи
│   │   ├── PushNotificationManager.tsx  # Управление уведомлениями
│   │   ├── PWAInstallGuide.tsx          # Гайд по установке PWA
│   │   └── Dashboard/         # Финансовый дашборд
│   │       ├── CurrencyPanel.tsx    # Панель валюты/ставки
│   │       ├── MiningPanel.tsx      # Панель майнинга
│   │       ├── RateChart.tsx        # График (Chart.js)
│   │       └── PayoutCalendar.tsx   # Календарь выплат
│   └── lib/
│       ├── db.ts              # Prisma клиент (singleton)
│       └── parsers/           # Парсеры внешних API
│           ├── types.ts       # TypeScript типы
│           ├── cbr.ts         # ЦБ РФ (USD, ключевая ставка)
│           ├── mexc.ts        # MEXC биржа (XMR/USDT)
│           ├── hashvault.ts   # HashVault (майнинг Monero)
│           └── index.ts       # Реэкспорт всех парсеров
├── .env.example               # Пример переменных окружения
├── CLAUDE.md                  # Инструкции для AI-агентов
├── README.md                  # Этот файл
└── package.json
```

---

## Решение проблем

### Порт 3000 занят
```bash
npx kill-port 3000
# или запусти на другом порту:
PORT=3001 npm run dev
```

### Ошибка "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Ошибка "DATABASE_URL not found"
Убедись, что файл `.env` существует в корне проекта и содержит `DATABASE_URL`.

### Ошибка "Database does not exist"
```bash
npx prisma migrate dev --name init
```

---

## Дальнейшее развитие

- [x] Drag & drop для задач
- [x] Деплой на Vercel
- [x] PostgreSQL с синхронизацией
- [x] Подзадачи (чеклист)
- [x] PWA — установка на телефон
- [x] Push-уведомления
- [x] Финансовый дашборд (USD, XMR, ставка ЦБ, майнинг)
- [x] Тёмная тема финансового дашборда
- [ ] Telegram бот для уведомлений
- [ ] Повторяющиеся задачи
- [ ] Экспорт/импорт данных
- [ ] Тёмная тема для всего приложения
- [ ] Статистика и аналитика
