/**
 * @file API-маршрут для работы с подзадачами конкретной задачи
 * @description Обрабатывает GET (получение подзадач задачи) и POST (создание новой подзадачи).
 * ID родительской задачи передается как динамический сегмент маршрута [id].
 * Подзадачи представляют собой чеклист внутри задачи (можно отмечать как выполненные).
 *
 * Эндпоинт: /api/tasks/[id]/subtasks
 * Методы: GET, POST
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Получает все подзадачи для указанной задачи.
 *
 * Подзадачи отсортированы по полю sortOrder (по возрастанию)
 * для сохранения пользовательского порядка в чеклисте.
 *
 * @param {Request} request - входящий HTTP-запрос (тело не используется)
 * @param {object} params - параметры маршрута
 * @param {string} params.id - UUID родительской задачи
 * @returns {Promise<NextResponse>} JSON-массив подзадач или ошибка 500
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Получаем подзадачи, принадлежащие конкретной задаче, с сортировкой по порядку
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

/**
 * Создает новую подзадачу для указанной задачи.
 *
 * Принимает JSON-тело запроса с полями:
 * - title (string, обязательно): текст подзадачи
 * - sortOrder (number, по умолчанию 0): порядок в чеклисте
 *
 * Новая подзадача создается в статусе completed = false (по умолчанию в схеме Prisma).
 * Привязка к родительской задаче осуществляется через taskId из URL-параметра.
 *
 * @param {Request} request - входящий HTTP-запрос с JSON-телом
 * @param {object} params - параметры маршрута
 * @param {string} params.id - UUID родительской задачи
 * @returns {Promise<NextResponse>} Созданная подзадача (статус 201) или ошибка 500
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Извлекаем данные из тела запроса
    const body = await request.json()
    const { title, sortOrder } = body

    // Создаем подзадачу с привязкой к родительской задаче
    const subtask = await prisma.subtask.create({
      data: {
        title,
        sortOrder: sortOrder || 0, // По умолчанию в начало списка
        taskId: params.id,         // Связь с родительской задачей через ID из URL
      },
    })

    // Возвращаем созданную подзадачу со статусом 201 (Created)
    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании подзадачи:", error)
    return NextResponse.json(
      { error: "Не удалось создать подзадачу" },
      { status: 500 }
    )
  }
}
