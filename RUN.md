# Запуск сервиса

## Быстрый старт

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка базы данных (см. раздел "База данных" ниже)

# 3. Запуск dev сервера
npm run dev
```

Сервис доступен по адресу: **http://localhost:3000**

---

## Требования

- **Node.js** 18.x или выше
- **npm** 9.x или выше
- **База данных PostgreSQL** (Neon или локальная)

Проверить версии:
```bash
node --version
npm --version
```

---

## База данных (PostgreSQL)

### Вариант 1: Neon (рекомендуется для production)

1. Зарегистрируйся на [neon.tech](https://neon.tech)
2. Создай проект `personal-organizer`
3. Скопируй **Connection String** (начинается с `postgresql://`)
4. Создай файл `.env` в корне проекта:
```env
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"
```

### Вариант 2: Локальная PostgreSQL

1. Установи PostgreSQL
2. Создай базу данных `organizer`
3. Создай файл `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/organizer"
```

### Применение миграций

```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate dev --name init

# Заполнение начальными данными (категории)
npx ts-node prisma/seed.ts
```

### Проверка базы данных

```bash
# Открыть Prisma Studio (GUI для базы)
npx prisma studio
```

---

## Пошаговая установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd personalOrganizer
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

Создай файл `.env`:
```env
DATABASE_URL="postgresql://..."
```

### 4. Инициализация базы данных

```bash
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### 5. Запуск сервера

**Режим разработки:**
```bash
npm run dev
```

**Production сборка:**
```bash
npm run build
npm run start
```

---

## Режимы работы

### Development (разработка)

```bash
npm run dev
```

- Hot reload при изменении файлов
- Source maps для отладки
- Доступен на `localhost:3000`

### Production

```bash
npm run build
npm run start
```

- Оптимизированная сборка
- Минимизированные ресурсы
- Доступен на `localhost:3000` (или PORT из env)

---

## Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev сервера |
| `npm run build` | Сборка production |
| `npm run start` | Запуск production сервера |
| `npm run lint` | Проверка кода ESLint |
| `npm run db:migrate` | Применение миграций БД |
| `npm run db:generate` | Генерация Prisma клиента |
| `npm run db:studio` | GUI для базы данных |

---

## Деплой на Vercel

Проект настроен для деплоя на Vercel:

1. Зайди на [vercel.com](https://vercel.com)
2. Нажми **"Add New Project"**
3. Выбери репозиторий `personalOrganizer`
4. Добавь переменную окружения:
   - **Name:** `DATABASE_URL`
   - **Value:** строка подключения из Neon
5. Нажми **"Deploy"**

Vercel автоматически:
- Установит зависимости
- Выполнит сборку (`npm run build`)
- Развернёт проект

### После деплоя:
- Сайт доступен по URL вида `https://personal-organizer-xxx.vercel.app`
- При каждом push в main проект автоматически пересобирается
- Данные сохраняются в PostgreSQL и синхронизируются между устройствами

---

## Troubleshooting

### Ошибка: "Port 3000 is already in use"

```bash
# Найти и завершить процесс
npx kill-port 3000

# Или запустить на другом порту
PORT=3001 npm run dev
```

### Ошибка: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### Ошибка: "Database does not exist"

```bash
# Проверь DATABASE_URL в .env
# Примени миграции
npx prisma migrate dev --name init
```

### Ошибка: "Task not found" после деплоя

Убедись что:
1. `DATABASE_URL` добавлен в Vercel Environment Variables
2. Миграции применены к боевой базе:
   ```bash
   npx prisma migrate deploy
   ```
3. Категории созданы:
   ```bash
   npx ts-node prisma/seed.ts
   ```

---

## Проверка работоспособности

После запуска открой в браузере:

**http://localhost:3000** - главная страница

**http://localhost:3000/api/tasks** - API endpoint (должен вернуть JSON с задачами)

---

## Разработка

### Структура проекта

```
personalOrganizer/
├── prisma/                 # База данных
│   ├── schema.prisma      # Схема БД
│   ├── seed.ts            # Начальные данные
│   └── migrations/        # Миграции
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   │   ├── tasks/     # CRUD для задач
│   │   │   └── categories/# CRUD для категорий
│   │   ├── page.tsx       # Главная страница
│   │   └── layout.tsx     # Корневой layout
│   ├── components/        # React компоненты
│   │   ├── Calendar.tsx
│   │   ├── TaskList.tsx
│   │   ├── DayView.tsx
│   │   ├── QuickAddTask.tsx
│   │   └── CreateTaskButton.tsx
│   └── lib/               # Утилиты
│       └── db.ts          # Prisma клиент
├── README.md              # Описание проекта
├── AGENTS.md              # Инструкции для AI
├── RUN.md                 # Этот файл
└── package.json
```

### Хранение данных

Данные сохраняются в **PostgreSQL базе данных** (Neon или локальной).

- ✅ Доступно с любого устройства
- ✅ Данные не пропадают при очистке куки
- ❌ Требуется интернет-соединение
- ✅ Автоматические бэкапы (на Neon)

### API Endpoints

- `GET /api/tasks` - получить все задачи
- `POST /api/tasks` - создать задачу
- `PUT /api/tasks/:id` - обновить задачу
- `DELETE /api/tasks/:id` - удалить задачу
- `GET /api/categories` - получить категории
- `POST /api/categories` - создать категорию

### Горячая перезагрузка

В режиме `npm run dev` изменения в коде автоматически перезагружают страницу.

### Отладка

Используй `console.log()` в коде - вывод виден в терминале где запущен `npm run dev`.

---

## Текущий стек (актуально)

- **Next.js:** 14.2.29
- **React:** 18.3.1
- **TypeScript:** 5.7.3
- **Tailwind CSS:** 4.0.3
- **Prisma:** 6.3.0
- **PostgreSQL:** 15+ (Neon)
- **date-fns:** 4.1.0
- **lucide-react:** 0.474.0

---

## План развития

См. [README.md](./README.md) раздел "Дальнейшее развитие"
