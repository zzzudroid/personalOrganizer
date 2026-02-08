/**
 * @file API-маршрут для работы с конкретной задачей по ID
 * @description Обрабатывает PUT (обновление задачи) и DELETE (удаление задачи).
 * ID задачи передается как динамический сегмент маршрута [id].
 * При удалении задачи все связанные подзадачи удаляются каскадно (onDelete: Cascade в схеме Prisma).
 *
 * Эндпоинт: /api/tasks/[id]
 * Методы: PUT, DELETE
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Обновляет существующую задачу по ID.
 *
 * Поддерживает частичные обновления — можно передать только те поля, которые нужно изменить.
 * Используется для:
 * - Редактирования заголовка/описания задачи
 * - Изменения статуса (todo → in_progress → done)
 * - Изменения приоритета
 * - Перетаскивания задачи на другую дату (обновление dueDate)
 * - Изменения порядка сортировки при drag & drop (обновление sortOrder)
 * - Назначения/изменения категории
 *
 * @param {Request} request - входящий HTTP-запрос с JSON-телом обновляемых полей
 * @param {object} params - параметры маршрута
 * @param {string} params.id - UUID задачи из URL
 * @returns {Promise<NextResponse>} Обновленная задача или ошибка 500
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Извлекаем обновляемые поля из тела запроса
    const body = await request.json()
    const { title, description, status, priority, sortOrder, dueDate, categoryId } = body

    // Обновляем задачу в БД по ID из URL-параметра
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status,
        priority,
        sortOrder,
        dueDate,
        categoryId: categoryId || null // Если categoryId не передан — убираем привязку к категории
      },
      include: {
        category: true // Возвращаем обновленную задачу вместе с категорией
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

/**
 * Удаляет задачу по ID.
 *
 * Благодаря настройке onDelete: Cascade в Prisma-схеме,
 * все подзадачи (Subtask) удаляются автоматически вместе с родительской задачей.
 *
 * @param {Request} request - входящий HTTP-запрос (тело не используется)
 * @param {object} params - параметры маршрута
 * @param {string} params.id - UUID задачи для удаления
 * @returns {Promise<NextResponse>} Объект { success: true } или ошибка 500
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Удаляем задачу — подзадачи удалятся каскадно
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
