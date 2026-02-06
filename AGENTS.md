# AGENTS.md

Guidelines for AI agents working on the Personal Organizer codebase.

## Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database (Prisma + SQLite)
npm run db:migrate   # Run migrations (interactive)
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio GUI
npx ts-node prisma/seed.ts  # Seed database

# Testing (Jest + React Testing Library - to be added)
npm test             # Run all tests
npm test -- --testNamePattern="TaskList"  # Single test
npm test -- --watch  # Watch mode
```

## Technology Stack

- Next.js 15 (App Router), React 19, TypeScript 5.7 (strict)
- Tailwind CSS 4, Prisma ORM + SQLite
- date-fns, lucide-react

## Code Style

### TypeScript
- Strict mode enabled - explicit types for all functions
- Prefer `interface` over `type` for objects
- Never use `any` - use `unknown` with type guards

### Imports (ordered)
```typescript
// 1. React/Next
import { useState } from "react";
import { NextResponse } from "next/server";

// 2. Third-party
import { format } from "date-fns";
import { Circle } from "lucide-react";

// 3. Internal (@/ alias)
import { prisma } from "@/lib/db";
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
| API Routes | kebab-case folders | `api/tasks/[id]/route.ts` |
| Database | snake_case + @@map | `@@map("tasks")` |

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
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- Log errors for debugging; user messages in Russian

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
│   │   └── [entity]/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── page.tsx
│   └── layout.tsx
├── components/           # React components
├── lib/                  # Utilities (db.ts, etc.)
└── types/                # Shared types
```

## Drag & Drop (HTML5 API)

```typescript
// State
const [draggedItem, setDraggedItem] = useState<Item | null>(null);
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

// Handlers
const handleDragStart = (e: React.DragEvent, item: Item) => {
  setDraggedItem(item);
  e.dataTransfer.setData("taskId", item.id);
  e.dataTransfer.effectAllowed = "move";
};

const handleDrop = (e: React.DragEvent, dropIndex: number) => {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("taskId");
  // Reorder logic + API call
};

// Visual feedback
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

## Important Notes
- Use `"use client"` for components with hooks/browser APIs
- Database URL: `DATABASE_URL="file:./dev.db"` in `.env`
- Restart dev server after changing `next.config.js` or `.env`
- Run `npx prisma generate` after schema changes
