# AGENTS.md

Guidelines for AI agents working on the Personal Organizer codebase.

## Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing (Jest + React Testing Library - to be added)
npm test             # Run all tests
npm test -- --testNamePattern="TaskList"  # Single test
npm test -- --watch  # Watch mode
```

## Technology Stack

- Next.js 14 (App Router), React 18, TypeScript 5.7 (strict)
- Tailwind CSS 4
- date-fns, lucide-react
- **Data Storage:** localStorage
- **Hosting:** Vercel

## Code Style

### TypeScript
- Strict mode enabled - explicit types for all functions
- Prefer `interface` over `type` for objects
- Never use `any` - use `unknown` with type guards

### Imports (ordered)
```typescript
// 1. React/Next
import { useState } from "react";

// 2. Third-party
import { format } from "date-fns";
import { Circle } from "lucide-react";

// 3. Internal (@/ alias)
import Calendar from "@/components/Calendar";

// 4. CSS last
import "./globals.css";
```

### Formatting
- Double quotes, no trailing semicolons, 2-space indent
- Max line length: 80-100 chars

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskList`, `CreateTaskButton` |
| Functions/Vars | camelCase | `fetchTasks`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_KEY` |
| Types/Interfaces | PascalCase | `Task`, `Category` |

### Components
```typescript
"use client"; // For client components only

interface Props {
  title: string;
  onAction?: () => void;
}

export default function ComponentName({ title, onAction }: Props) {
  const [state, setState] = useState(false);
  return <div className="bg-white p-4">{title}</div>;
}
```

### Error Handling
- Wrap async operations in try-catch
- Log errors for debugging
- User messages in Russian

### Styling (Tailwind)
- Semantic colors: `bg-gray-50`, `text-red-600`
- Conditional classes with template literals
- Responsive: `sm:`, `md:`, `lg:`, `xl:`
- Transitions: `transition-colors duration-200`

### Localization
- **UI Language: Russian**
- **Git commits: Russian only**
- **Code comments: Russian only**
- date-fns with Russian locale: `format(date, "d MMMM", { locale: ru })`
- Error messages in Russian

## File Structure

```
src/
├── app/
│   ├── page.tsx       # Main page
│   └── layout.tsx     # Root layout
└── components/        # React components
```

## Data Storage (localStorage)

```typescript
const STORAGE_KEY = "personal-organizer-tasks";

// Save
localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

// Load
const stored = localStorage.getItem(STORAGE_KEY);
const tasks = stored ? JSON.parse(stored) : [];
```

## Drag & Drop (HTML5 API)

```typescript
const [draggedItem, setDraggedItem] = useState<Item | null>(null);
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

const handleDragStart = (e: React.DragEvent, item: Item) => {
  setDraggedItem(item);
  e.dataTransfer.setData("taskId", item.id);
  e.dataTransfer.effectAllowed = "move";
};

const handleDrop = (e: React.DragEvent, dropIndex: number) => {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("taskId");
  // Reorder logic
};

className={`
  ${isDragged ? "opacity-50 rotate-2 scale-95" : ""}
  ${isDragOver ? "border-blue-500 bg-blue-50" : ""}
  cursor-move
`}
```

## Git
- Commit messages: **Russian language only**, present tense
- Format: `feat:`, `fix:`, `refactor:`, `docs:`
- One logical change per commit

## Deployment (Vercel)

1. Подключить GitHub репозиторий на [vercel.com](https://vercel.com)
2. Нажать **Deploy**
3. Vercel автоматически соберёт и развернёт проект

### Важно при деплое:
- Next.js 14.x (не 15.x - заблокирован на Vercel из-за CVE)
- React 18.x (не 19.x)
- Без .env файла (localStorage не требует переменных окружения)

## Important Notes
- Use `"use client"` for components with hooks/browser APIs
- Restart dev server after changing `next.config.js`
- Проект развёрнут на Vercel и работает на localStorage
