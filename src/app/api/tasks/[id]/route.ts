import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, status, priority, sortOrder, dueDate, categoryId } = body
    
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status,
        priority,
        sortOrder,
        dueDate,
        categoryId: categoryId || null
      },
      include: {
        category: true
      }
    })
    
    return NextResponse.json(task)
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error)
    return NextResponse.json(
      { error: "Не удалось обновить задачу" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.task.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка при удалении задачи:", error)
    return NextResponse.json(
      { error: "Не удалось удалить задачу" },
      { status: 500 }
    )
  }
}
