import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 }
      )
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка при удалении подписки:", error)
    return NextResponse.json(
      { error: "Не удалось удалить подписку" },
      { status: 500 }
    )
  }
}
