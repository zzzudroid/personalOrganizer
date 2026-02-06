"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверяем поддержку push-уведомлений
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Ошибка при проверке подписки:", error);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Получаем публичный VAPID ключ
      const response = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await response.json();

      if (!publicKey) {
        alert("Push-уведомления не настроены на сервере");
        return;
      }

      // Запрашиваем разрешение
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Разрешение на уведомления не получено");
        return;
      }

      // Подписываемся
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Отправляем подписку на сервер
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
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

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Отправляем запрос на отписку
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

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

  // Преобразует base64url строку в Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  // Преобразует ArrayBuffer в base64 строку
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSubscribed
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      } disabled:opacity-50`}
      title={isSubscribed ? "Отключить уведомления" : "Включить push-уведомления"}
    >
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
