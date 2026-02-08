/**
 * @file API-маршрут для подписки на push-уведомления
 * @description Обрабатывает POST-запрос для сохранения подписки на Web Push уведомления.
 * Подписка содержит endpoint и ключи шифрования (p256dh, auth), необходимые для отправки
 * push-уведомлений через Web Push API.
 *
 * Используется паттерн upsert: если подписка с таким endpoint уже существует,
 * обновляются только ключи шифрования (они могут измениться при переподписке).
 *
 * Эндпоинт: /api/push/subscribe
 * Методы: POST
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Сохраняет или обновляет подписку на push-уведомления.
 *
 * Принимает JSON-тело запроса с полями:
 * - endpoint (string, обязательно): URL для отправки push-уведомлений (уникален для каждого браузера/устройства)
 * - keys.p256dh (string, обязательно): публичный ключ шифрования (P-256 Diffie-Hellman)
 * - keys.auth (string, обязательно): секрет аутентификации для шифрования payload
 *
 * Валидация: проверяется наличие всех обязательных полей перед сохранением.
 * Использует upsert для идемпотентности — повторный вызов с тем же endpoint обновит ключи.
 *
 * @param {Request} request - входящий HTTP-запрос с данными подписки
 * @returns {Promise<NextResponse>} Объект { success: true } или ошибка 400/500
 */
export async function POST(request: Request) {
  try {
    // Извлекаем данные подписки из тела запроса
    const body = await request.json()
    const { endpoint, keys } = body

    // Валидация обязательных полей: endpoint, ключ шифрования p256dh и секрет auth
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Сохраняем или обновляем подписку (upsert по уникальному endpoint)
    // Если подписка с таким endpoint уже есть — обновляем ключи
    // Если нет — создаем новую запись
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh, // Обновляем ключ шифрования
        auth: keys.auth,     // Обновляем секрет аутентификации
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка при сохранении подписки:", error)
    return NextResponse.json(
      { error: "Не удалось сохранить подписку" },
      { status: 500 }
    )
  }
}
