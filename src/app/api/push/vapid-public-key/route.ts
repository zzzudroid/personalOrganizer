/**
 * @file API-маршрут для получения публичного VAPID-ключа
 * @description Возвращает публичный VAPID-ключ, необходимый клиенту для подписки
 * на Web Push уведомления. VAPID (Voluntary Application Server Identification)
 * — это протокол аутентификации, который позволяет серверу идентифицировать себя
 * перед push-сервисом браузера.
 *
 * Публичный ключ хранится в переменной окружения VAPID_PUBLIC_KEY.
 * Приватный ключ (VAPID_PRIVATE_KEY) используется только на сервере при отправке уведомлений.
 *
 * Эндпоинт: /api/push/vapid-public-key
 * Методы: GET
 */

import { NextResponse } from "next/server"

/**
 * Возвращает публичный VAPID-ключ для клиентской подписки на push-уведомления.
 *
 * Клиент использует этот ключ при вызове PushManager.subscribe()
 * для установления доверенного соединения с сервером push-уведомлений.
 *
 * Если переменная окружения VAPID_PUBLIC_KEY не настроена,
 * возвращается ошибка 500 — push-уведомления недоступны без ключа.
 *
 * @returns {Promise<NextResponse>} Объект { publicKey: string } или ошибка 500
 */
export async function GET() {
  // Получаем публичный VAPID-ключ из переменных окружения
  const publicKey = process.env.VAPID_PUBLIC_KEY

  // Проверяем, что ключ настроен в окружении
  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID public key not configured" },
      { status: 500 }
    )
  }

  return NextResponse.json({ publicKey })
}
