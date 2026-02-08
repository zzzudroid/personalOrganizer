"use client";

/**
 * Компонент управления push-уведомлениями через Web Push API.
 *
 * Предоставляет кнопку для включения/отключения push-уведомлений.
 * Работает через Service Worker и VAPID-ключи для аутентификации.
 *
 * Процесс подписки:
 * 1. Получение публичного VAPID-ключа с сервера (/api/push/vapid-public-key)
 * 2. Запрос разрешения на уведомления у пользователя (Notification.requestPermission)
 * 3. Подписка через PushManager.subscribe с VAPID-ключом
 * 4. Отправка данных подписки (endpoint + ключи шифрования) на сервер (/api/push/subscribe)
 *
 * Процесс отписки:
 * 1. Получение текущей подписки через PushManager.getSubscription
 * 2. Отправка endpoint на сервер для удаления из БД (/api/push/unsubscribe)
 * 3. Локальная отписка через subscription.unsubscribe()
 *
 * Компонент возвращает null, если браузер не поддерживает Push API
 * (например, Safari на iOS < 16.4).
 */

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

/**
 * Компонент кнопки управления push-уведомлениями.
 * Автоматически определяет поддержку Push API и текущий статус подписки.
 *
 * @returns JSX-кнопка для включения/отключения уведомлений, или null при отсутствии поддержки
 */
export default function PushNotificationManager() {
  // ==================== Состояние компонента ====================

  /** Поддерживает ли текущий браузер Service Worker и Push API */
  const [isSupported, setIsSupported] = useState(false);

  /** Подписан ли пользователь на push-уведомления в данный момент */
  const [isSubscribed, setIsSubscribed] = useState(false);

  /** Флаг загрузки (блокирует кнопку на время операций подписки/отписки) */
  const [isLoading, setIsLoading] = useState(false);

  // ==================== Инициализация ====================

  /**
   * Эффект: при монтировании проверяет поддержку Push API в браузере.
   * Если Service Worker и PushManager доступны — отмечает поддержку
   * и проверяет текущий статус подписки.
   */
  useEffect(() => {
    // Проверяем поддержку push-уведомлений
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  // ==================== Проверка подписки ====================

  /**
   * Проверяет, существует ли активная push-подписка.
   * Получает текущую подписку через PushManager и обновляет состояние.
   */
  const checkSubscription = async () => {
    try {
      // Ожидаем готовности Service Worker
      const registration = await navigator.serviceWorker.ready;
      // Получаем текущую подписку (null если не подписан)
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Ошибка при проверке подписки:", error);
    }
  };

  // ==================== Подписка на уведомления ====================

  /**
   * Выполняет полный процесс подписки на push-уведомления:
   * 1. Запрашивает публичный VAPID-ключ с сервера
   * 2. Запрашивает разрешение у пользователя
   * 3. Создаёт подписку через PushManager
   * 4. Отправляет данные подписки на сервер для сохранения в БД
   */
  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Шаг 1: Получаем публичный VAPID ключ с сервера
      const response = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await response.json();

      if (!publicKey) {
        alert("Push-уведомления не настроены на сервере");
        return;
      }

      // Шаг 2: Запрашиваем разрешение на показ уведомлений
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Разрешение на уведомления не получено");
        return;
      }

      // Шаг 3: Создаём подписку через PushManager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Обязательно: каждое push-сообщение должно показывать уведомление
        applicationServerKey: urlBase64ToUint8Array(publicKey), // Конвертация VAPID-ключа в бинарный формат
      });

      // Шаг 4: Отправляем подписку на сервер для сохранения
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            // p256dh — публичный ключ клиента для шифрования push-сообщений
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
            // auth — секрет аутентификации для подтверждения подписки
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
          },
        }),
      });

      setIsSubscribed(true);
      alert("Push-уведомления включены!");
    } catch (error) {
      console.error("Ошибка при подписке:", error);
      alert("Не удалось включить push-уведомления");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== Отписка от уведомлений ====================

  /**
   * Выполняет отписку от push-уведомлений:
   * 1. Получает текущую подписку из PushManager
   * 2. Отправляет endpoint на сервер для удаления записи из БД
   * 3. Локально отписывается через subscription.unsubscribe()
   */
  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Уведомляем сервер об отписке (удаление из таблицы PushSubscription)
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Локальная отписка в браузере
        await subscription.unsubscribe();
        setIsSubscribed(false);
        alert("Push-уведомления отключены");
      }
    } catch (error) {
      console.error("Ошибка при отписке:", error);
      alert("Не удалось отключить push-уведомления");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== Вспомогательные функции кодирования ====================

  /**
   * Преобразует строку в формате Base64URL в Uint8Array.
   *
   * VAPID-ключи приходят с сервера в формате Base64URL (RFC 4648 Section 5),
   * а PushManager.subscribe требует applicationServerKey в виде Uint8Array.
   *
   * Шаги преобразования:
   * 1. Добавляем padding символы "=" до кратности 4
   * 2. Заменяем Base64URL символы на стандартные Base64: "-" -> "+", "_" -> "/"
   * 3. Декодируем Base64 строку через atob()
   * 4. Конвертируем каждый символ в байт (charCodeAt)
   *
   * @param base64String - Строка в формате Base64URL
   * @returns Uint8Array с бинарными данными ключа
   */
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  /**
   * Преобразует ArrayBuffer в строку Base64.
   *
   * Используется для кодирования ключей подписки (p256dh, auth)
   * перед отправкой на сервер в формате JSON.
   *
   * @param buffer - ArrayBuffer с бинарными данными ключа
   * @returns Base64-строка
   */
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    // Побайтовое преобразование в строку символов
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // ==================== Рендеринг ====================

  // Если Push API не поддерживается браузером — не отображаем кнопку
  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSubscribed
          ? "bg-green-100 text-green-700 hover:bg-green-200"  // Зелёная кнопка — уведомления включены
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"     // Серая кнопка — уведомления выключены
      } disabled:opacity-50`}
      title={isSubscribed ? "Отключить уведомления" : "Включить push-уведомления"}
    >
      {/* Иконка и текст меняются в зависимости от статуса подписки */}
      {isSubscribed ? (
        <>
          <Bell className="w-4 h-4" />
          <span>Уведомления включены</span>
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          <span>Включить уведомления</span>
        </>
      )}
    </button>
  );
}
