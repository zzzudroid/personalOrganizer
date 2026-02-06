# Запуск сервиса

## Быстрый старт

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск dev сервера
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

### 3. Запуск сервера

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

---

## Troubleshooting

### Ошибка: "Port 3000 is already in use"

```bash
# Найти и завершить процесс
npx kill-port 3000

# Или запустить на другом порту
PORT=3001 npm run dev
```

---

## Проверка работоспособности

После запуска откройте в браузере:

**http://localhost:3000** - главная страница

---

## Разработка

### Структура проекта

```
personalOrganizer/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # Главная страница
│   │   └── layout.tsx    # Корневой layout
│   └── components/       # React компоненты
└── package.json
```

### Хранение данных

Данные сохраняются в **localStorage** браузера под ключом `"personal-organizer-tasks"`.

- ✅ Быстро и просто
- ✅ Работает офлайн
- ❌ Не синхронизируется между устройствами
- ❌ Теряются при очистке куки/кэша

### План перехода на Vercel Postgres

См. [AGENTS.md](./AGENTS.md) раздел "Migration to Vercel Postgres"

### Горячая перезагрузка

В режиме `npm run dev` изменения в коде автоматически перезагружают страницу.

### Отладка

Используйте `console.log()` в коде - вывод виден в терминале где запущен `npm run dev`.
