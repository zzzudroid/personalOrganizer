import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc"
      }
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Ошибка при получении категорий:", error)
    return NextResponse.json(
      { error: "Не удалось получить категории" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, color } = body
    
    const category = await prisma.category.create({
      data: {
        name,
        color: color || "#3b82f6"
      }
    })
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании категории:", error)
    return NextResponse.json(
      { error: "Не удалось создать категорию" },
      { status: 500 }
    )
  }
}
