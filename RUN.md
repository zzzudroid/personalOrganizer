# Запуск сервиса

## Быстрый старт

```bash
# 1. Установка зависимостей
npm install

# 2. Создание .env файла (если отсутствует)
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'NEXT_PUBLIC_APP_URL="http://localhost:3000"' >> .env

# 3. Инициализация базы данных
npx prisma migrate dev --name init
npx prisma generate

# 4. Запуск dev сервера
npm run dev
```

Сервис доступен по адресу: **http://localhost:3000**

---

## Требования

- **Node.js** 18.x или выше
- **npm** 9.x или выше

Проверить версии:
```bash
node --version
npm --version
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

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Инициализация базы данных

```bash
# Создание миграций и применение
npx prisma migrate dev --name init

# Генерация Prisma клиента
npx prisma generate

# (Опционально) Заполнение тестовыми данными
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
| `npm run db:studio` | GUI для базы данных (Prisma Studio) |

---

## Troubleshooting

### Ошибка: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### Ошибка: "Database does not exist"

```bash
npx prisma migrate dev --name init
```

### Ошибка: "Port 3000 is already in use"

```bash
# Найти и завершить процесс
npx kill-port 3000

# Или запустить на другом порту
PORT=3001 npm run dev
```

### Ошибка: "env(s) not found"

Убедитесь, что файл `.env` существует и содержит:
```env
DATABASE_URL="file:./dev.db"
```

### Prisma Studio не открывается

```bash
npx prisma studio --port 5555
```

---

## Работа с базой данных

### Просмотр данных

```bash
npm run db:studio
```

Откроется интерфейс на `http://localhost:5555`

### Сброс базы данных

```bash
# Удалить файл базы данных
rm prisma/dev.db

# Пересоздать миграции
npx prisma migrate dev --name init
```

### Создание новой миграции

```bash
npx prisma migrate dev --name <название_изменения>
```

---

## Переменные окружения

| Переменная | Описание | Значение по умолчанию |
|------------|----------|----------------------|
| `DATABASE_URL` | Путь к SQLite БД | `file:./dev.db` |
| `NEXT_PUBLIC_APP_URL` | URL приложения | `http://localhost:3000` |
| `PORT` | Порт сервера | `3000` |

---

## Проверка работоспособности

После запуска откройте в браузере:

1. **http://localhost:3000** - главная страница
2. **http://localhost:3000/api/tasks** - API endpoint (должен вернуть JSON)

---

## Разработка

### Структура проекта

```
personalOrganizer/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── page.tsx      # Главная страница
│   │   └── layout.tsx    # Корневой layout
│   ├── components/       # React компоненты
│   └── lib/              # Утилиты
├── prisma/
│   ├── schema.prisma     # Схема БД
│   └── seed.ts           # Тестовые данные
└── .env                  # Переменные окружения
```

### Горячая перезагрузка

В режиме `npm run dev` изменения в коде автоматически перезагружают страницу.

### Отладка

Используйте `console.log()` в коде - вывод виден в терминале где запущен `npm run dev`.
