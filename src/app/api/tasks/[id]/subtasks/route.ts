import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subtasks = await prisma.subtask.findMany({
      where: { taskId: params.id },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(subtasks)
  } catch (error) {
    console.error("Ошибка при получении подзадач:", error)
    return NextResponse.json(
      { error: "Не удалось получить подзадачи" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, sortOrder } = body

    const subtask = await prisma.subtask.create({
      data: {
        title,
        sortOrder: sortOrder || 0,
        taskId: params.id,
      },
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании подзадачи:", error)
    return NextResponse.json(
      { error: "Не удалось создать подзадачу" },
      { status: 500 }
    )
  }
}
