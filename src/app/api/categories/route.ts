/**
 * @file API-маршрут для работы с категориями задач
 * @description Обрабатывает GET (получение списка категорий) и POST (создание новой категории).
 * Категории используются для группировки задач (например: "Работа", "Личное", "Учеба").
 * Каждая категория имеет уникальное имя и цвет для визуального отображения в UI.
 *
 * Эндпоинт: /api/categories
 * Методы: GET, POST
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Получает список всех категорий из базы данных.
 *
 * Категории отсортированы по имени в алфавитном порядке (по возрастанию).
 * Используется для заполнения выпадающего списка при создании/редактировании задачи.
 *
 * @returns {Promise<NextResponse>} JSON-массив категорий или ошибка 500
 */
export async function GET() {
  try {
    // Получаем все категории, отсортированные по имени
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc" // Алфавитная сортировка для удобства пользователя
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

/**
 * Создает новую категорию в базе данных.
 *
 * Принимает JSON-тело запроса с полями:
 * - name (string, обязательно): уникальное название категории
 * - color (string, по умолчанию "#3b82f6"): HEX-код цвета для отображения в UI
 *
 * Имя категории должно быть уникальным (ограничение @unique в Prisma-схеме).
 * Цвет по умолчанию — синий (#3b82f6), соответствующий основной палитре приложения.
 *
 * @param {Request} request - входящий HTTP-запрос с JSON-телом
 * @returns {Promise<NextResponse>} Созданная категория (статус 201) или ошибка 500
 */
export async function POST(request: Request) {
  try {
    // Извлекаем данные из тела запроса
    const body = await request.json()
    const { name, color } = body

    // Создаем категорию с цветом по умолчанию, если не указан
    const category = await prisma.category.create({
      data: {
        name,
        color: color || "#3b82f6" // Синий цвет по умолчанию
      }
    })

    // Возвращаем созданную категорию со статусом 201 (Created)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании категории:", error)
    return NextResponse.json(
      { error: "Не удалось создать категорию" },
      { status: 500 }
    )
  }
}
