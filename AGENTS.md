# AGENTS.md

Guidelines for AI agents working on the Personal Organizer codebase.

## Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:migrate   # Run migrations (interactive)
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio GUI
npx ts-node prisma/seed.ts  # Seed database with initial data

# Testing (Jest + React Testing Library - to be added)
npm test             # Run all tests
npm test -- --testNamePattern="TaskList"  # Single test
npm test -- --watch  # Watch mode
```

## Technology Stack

- Next.js 14 (App Router), React 18, TypeScript 5.7 (strict)
- Tailwind CSS 4
- Prisma ORM
- PostgreSQL (Neon)
- date-fns, lucide-react
- **Data Storage:** PostgreSQL (Neon) - cloud database with sync
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
import { prisma } from "@/lib/db";

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
| API Routes | kebab-case folders | `api/tasks/[id]/route.ts` |

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

### API Routes
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.model.findMany();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
```

### Error Handling
- Wrap async operations in try-catch
- Log errors for debugging
- User messages in Russian

### Database (Prisma)
- UUID IDs: `@id @default(uuid())`
- Always include `createdAt`, `updatedAt`
- Use `@@map` for snake_case table names
- Explicit foreign keys for relations

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
│   ├── api/              # API routes
│   │   ├── tasks/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── categories/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
├── components/           # React components
├── lib/                  # Utilities
│   └── db.ts            # Prisma client
└── types/               # Shared types (if needed)
```

## Data Storage (PostgreSQL)

Data is stored in PostgreSQL database (Neon):

```typescript
// Fetch tasks from API
const response = await fetch("/api/tasks");
const tasks = await response.json();

// Create task via API
const response = await fetch("/api/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "...", priority: "medium" }),
});
```

## Drag & Drop (HTML5 API)

```typescript
const handleDragStart = (e: React.DragEvent, task: Task) => {
  e.dataTransfer.setData("taskId", task.id);
  e.dataTransfer.effectAllowed = "move";
};

const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("taskId");
  
  // Update via API
  await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sortOrder: dropIndex }),
  });
};
```

## Git
- Commit messages: **Russian language only**, present tense
- Format: `feat:`, `fix:`, `refactor:`, `docs:`
- One logical change per commit

## Deployment (Vercel)

1. Подключить GitHub репозиторий на [vercel.com](https://vercel.com)
2. Добавить переменную окружения `DATABASE_URL` из Neon
3. Нажать **Deploy**
4. Vercel автоматически соберёт и развернёт проект

### Важно при деплое:
- Next.js 14.x (не 15.x - заблокирован на Vercel из-за CVE)
- React 18.x (не 19.x)
- Нужна переменная `DATABASE_URL` в Vercel
- База данных: PostgreSQL (Neon)

## Important Notes
- Use `"use client"` for components with hooks/browser APIs
- Always use API routes for data operations (not localStorage)
- Prisma client is cached in `src/lib/db.ts`
- Restart dev server after changing `next.config.js`
