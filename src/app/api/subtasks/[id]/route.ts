/**
 * @file API-маршрут для работы с конкретной подзадачей по ID
 * @description Обрабатывает PUT (обновление подзадачи) и DELETE (удаление подзадачи).
 * ID подзадачи передается как динамический сегмент маршрута [id].
 * Используется для переключения статуса чеклиста, редактирования текста и изменения порядка.
 *
 * Эндпоинт: /api/subtasks/[id]
 * Методы: PUT, DELETE
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Обновляет существующую подзадачу по ID.
 *
 * Поддерживает частичные обновления. Основные сценарии использования:
 * - Переключение статуса выполнения (completed: true/false) — при клике на чекбокс
 * - Редактирование текста подзадачи (title)
 * - Изменение порядка сортировки (sortOrder) — при drag & drop в чеклисте
 *
 * @param {Request} request - входящий HTTP-запрос с JSON-телом обновляемых полей
 * @param {object} params - параметры маршрута
 * @param {string} params.id - UUID подзадачи
 * @returns {Promise<NextResponse>} Обновленная подзадача или ошибка 500
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Извлекаем обновляемые поля из тела запроса
    const body = await request.json()
    const { title, completed, sortOrder } = body

    // Обновляем подзадачу в БД по ID из URL-параметра
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

/**
 * Удаляет подзадачу по ID.
 *
 * Удаляет отдельный элемент чеклиста. Родительская задача при этом не затрагивается.
 *
 * @param {Request} request - входящий HTTP-запрос (тело не используется)
 * @param {object} params - параметры маршрута
 * @param {string} params.id - UUID подзадачи для удаления
 * @returns {Promise<NextResponse>} Объект { success: true } или ошибка 500
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Удаляем подзадачу из БД
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
