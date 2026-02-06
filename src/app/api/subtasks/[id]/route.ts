import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, completed, sortOrder } = body

    const subtask = await prisma.subtask.update({
      where: { id: params.id },
      data: {
        title,
        completed,
        sortOrder,
      },
    })

    return NextResponse.json(subtask)
  } catch (error) {
    console.error("Ошибка при обновлении подзадачи:", error)
    return NextResponse.json(
      { error: "Не удалось обновить подзадачу" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.subtask.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка при удалении подзадачи:", error)
    return NextResponse.json(
      { error: "Не удалось удалить подзадачу" },
      { status: 500 }
    )
  }
}
