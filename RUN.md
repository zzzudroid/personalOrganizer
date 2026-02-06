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

## Деплой на Vercel

Проект настроен для деплоя на Vercel:

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите **"Add New Project"**
3. Выберите репозиторий `personalOrganizer`
4. Нажмите **"Deploy"**

Vercel автоматически:
- Установит зависимости
- Выполнит сборку (`npm run build`)
- Развернёт проект

### После деплоя:
- Сайт доступен по URL вида `https://personal-organizer-xxx.vercel.app`
- При каждом push в main проект автоматически пересобирается

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
├── README.md             # Описание проекта
├── AGENTS.md             # Инструкции для AI
├── RUN.md                # Этот файл
└── package.json
```

### Хранение данных

Данные сохраняются в **localStorage** браузера под ключом `"personal-organizer-tasks"`.

- ✅ Быстро и просто
- ✅ Работает офлайн
- ❌ Не синхронизируется между устройствами
- ❌ Теряются при очистке куки/кэша

### Горячая перезагрузка

В режиме `npm run dev` изменения в коде автоматически перезагружают страницу.

### Отладка

Используйте `console.log()` в коде - вывод виден в терминале где запущен `npm run dev`.

---

## Текущий стек (актуально)

- **Next.js:** 14.2.29
- **React:** 18.3.1
- **TypeScript:** 5.7.3
- **Tailwind CSS:** 4.0.3
- **date-fns:** 4.1.0
- **lucide-react:** 0.474.0

---

## План развития

См. [README.md](./README.md) раздел "Дальнейшее развитие"
