/**
 * @file API-маршрут для отписки от push-уведомлений
 * @description Обрабатывает POST-запрос для удаления подписки на Web Push уведомления.
 * Удаляет все записи с указанным endpoint из базы данных.
 * Используется deleteMany вместо delete для безопасности — не выбросит ошибку,
 * если подписка уже была удалена ранее.
 *
 * Эндпоинт: /api/push/unsubscribe
 * Методы: POST
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Удаляет подписку на push-уведомления по endpoint.
 *
 * Принимает JSON-тело запроса с полями:
 * - endpoint (string, обязательно): URL подписки, которую нужно удалить
 *
 * Использует deleteMany для безопасного удаления — если записи нет, ошибка не возникнет.
 * Это важно, так как пользователь может нажать "Отписаться" повторно или подписка
 * могла быть удалена автоматически.
 *
 * @param {Request} request - входящий HTTP-запрос с endpoint для удаления
 * @returns {Promise<NextResponse>} Объект { success: true } или ошибка 400/500
 */
export async function POST(request: Request) {
  try {
    // Извлекаем endpoint из тела запроса
    const body = await request.json()
    const { endpoint } = body

    // Валидация: endpoint обязателен для идентификации подписки
    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 }
      )
    }

    // Удаляем все подписки с указанным endpoint (безопасно, даже если записи нет)
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
