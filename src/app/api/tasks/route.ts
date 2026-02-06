import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        category: true,
        subtasks: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      },
      orderBy: {
        sortOrder: "asc"
      }
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Ошибка при получении задач:", error)
    return NextResponse.json(
      { error: "Не удалось получить задачи" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, status, priority, sortOrder, dueDate, categoryId } = body
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "todo",
        priority: priority || "medium",
        sortOrder: sortOrder || 0,
        dueDate,
        categoryId: categoryId || null
      },
      include: {
        category: true
      }
    })
    
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании задачи:", error)
    return NextResponse.json(
      { error: "Не удалось создать задачу" },
      { status: 500 }
    )
  }
}
