"use client";

/**
 * Компонент модального окна с инструкцией по установке PWA.
 *
 * Отображает пошаговые инструкции по установке приложения в зависимости
 * от платформы пользователя (iOS, Android, Mac, Windows).
 * Платформа определяется автоматически по userAgent.
 *
 * Содержит:
 * - Список преимуществ установки (иконка на рабочем столе, офлайн-режим и т.д.)
 * - Пошаговые инструкции для текущей платформы
 * - Примечание о поддержке функций (например, ограничения Push на iOS)
 * - Кнопку "Установить сейчас" (вызывает сохранённый beforeinstallprompt событие)
 *
 * Компонент является модальным окном (fixed overlay с backdrop).
 * Закрывается по кнопке X или кнопке "Позже".
 */

import { useState, useEffect } from "react";
import { X, Smartphone, Download, Bell, Wifi, CheckCircle } from "lucide-react";

/** Пропсы компонента PWAInstallGuide */
interface PWAInstallGuideProps {
  /** Callback для закрытия модального окна */
  onClose: () => void;
}

/**
 * Компонент инструкции по установке PWA-приложения.
 * Определяет платформу и показывает соответствующие шаги установки.
 *
 * @param onClose - Функция, вызываемая при закрытии модального окна
 * @returns JSX-элемент модального окна с инструкциями
 */
export default function PWAInstallGuide({ onClose }: PWAInstallGuideProps) {
  // ==================== Состояние компонента ====================

  /** Определённая платформа пользователя: "ios", "android", "mac" или "windows" */
  const [platform, setPlatform] = useState<string>("");

  /** Можно ли программно вызвать установку (наличие beforeinstallprompt в window) */
  const [isInstallable, setIsInstallable] = useState(false);

  // ==================== Определение платформы ====================

  /**
   * Эффект: при монтировании определяет платформу пользователя по userAgent
   * и проверяет доступность программной установки PWA.
   *
   * Порядок проверки:
   * 1. iOS устройства (iPhone, iPad, iPod)
   * 2. Android устройства
   * 3. Mac (macOS)
   * 4. Windows (по умолчанию, если ничего не совпало)
   */
  useEffect(() => {
    // Определяем платформу по строке userAgent
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else if (/macintosh|mac os x/.test(userAgent)) {
      setPlatform("mac");
    } else {
      setPlatform("windows");
    }

    // Проверяем, можно ли программно вызвать установку (Chromium-based браузеры)
    if ("serviceWorker" in navigator && "beforeinstallprompt" in window) {
      setIsInstallable(true);
    }
  }, []);

  // ==================== Инструкции по платформам ====================

  /**
   * Возвращает объект с инструкциями по установке для текущей платформы.
   * Каждая платформа имеет:
   * - title: Название платформы
   * - steps: Массив пошаговых инструкций
   * - note: Примечание о поддержке функций
   *
   * @returns Объект с полями title, steps и note
   */
  const getInstructions = () => {
    switch (platform) {
      case "ios":
        return {
          title: "iPhone / iPad",
          steps: [
            "Откройте сайт в Safari",
            'Нажмите кнопку "Поделиться" (квадрат со стрелкой)',
            'Выберите "На экран Домой"',
            'Нажмите "Добавить"',
          ],
          // На iOS push-уведомления не работают (ограничение Apple до iOS 16.4+)
          note: "⚠️ Push-уведомления не работают на iOS (ограничение Apple)",
        };
      case "android":
        return {
          title: "Android",
          steps: [
            "Откройте сайт в Chrome",
            'Нажмите три точки (меню) вверху',
            'Выберите "Установить приложение"',
            'Нажмите "Установить"',
          ],
          note: "✅ Полная поддержка всех функций",
        };
      case "mac":
        return {
          title: "Mac",
          steps: [
            "Откройте сайт в Chrome",
            'Нажмите три точки (меню)',
            'Выберите "Установить приложение"',
            'Нажмите "Установить"',
          ],
          note: "✅ Работает офлайн и с уведомлениями",
        };
      default:
        // Windows — платформа по умолчанию
        return {
          title: "Windows",
          steps: [
            "Откройте сайт в Chrome или Edge",
            "В адресной строке нажмите иконку установки",
            'Или: три точки → "Установить приложение"',
            'Нажмите "Установить"',
          ],
          note: "✅ Работает офлайн и с уведомлениями",
        };
    }
  };

  /** Инструкции для текущей определённой платформы */
  const instructions = getInstructions();

  // ==================== Рендеринг ====================

  return (
    // Оверлей модального окна: полноэкранный полупрозрачный фон
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* ===== Шапка модального окна с градиентным фоном ===== */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="w-6 h-6" />
              Установить приложение
            </h2>
            {/* Кнопка закрытия модального окна */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-2 text-blue-100">
            Установите наш сайт как приложение на свой телефон или компьютер!
          </p>
        </div>

        {/* ===== Основное содержимое модального окна ===== */}
        <div className="p-6">

          {/* Сетка преимуществ установки PWA (2x2) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Преимущество: иконка на рабочем столе */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Download className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">Иконка на рабочем столе</span>
            </div>
            {/* Преимущество: работа без интернета (офлайн-режим) */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Wifi className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">Работает без интернета</span>
            </div>
            {/* Преимущество: push-уведомления */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-800">Push-уведомления</span>
            </div>
            {/* Преимущество: быстрый запуск */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-800">Быстрый запуск</span>
            </div>
          </div>

          {/* ===== Блок пошаговых инструкций для текущей платформы ===== */}
          <div className="bg-gray-50 rounded-xl p-5 mb-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              {/* Иконка платформы (яблоко/робот/компьютер) */}
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                {platform === "ios" ? "🍎" : platform === "android" ? "🤖" : "💻"}
              </span>
              {instructions.title}
            </h3>
            {/* Нумерованный список шагов установки */}
            <ol className="space-y-3">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  {/* Номер шага в синем кружке */}
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Примечание о поддержке функций на данной платформе */}
          <p className="text-sm text-gray-500 text-center mb-6">
            {instructions.note}
          </p>

          {/* ===== Кнопки действий ===== */}
          <div className="flex gap-3">
            {/* Кнопка "Позже": закрывает модальное окно без действий */}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Позже
            </button>
            {/* Кнопка "Установить сейчас": вызывает сохранённое событие beforeinstallprompt */}
            <button
              onClick={() => {
                /**
                 * Пытаемся вызвать нативный диалог установки PWA.
                 * Событие beforeinstallprompt перехватывается в глобальном скрипте
                 * и сохраняется в window.deferredPrompt.
                 * Если оно доступно — вызываем prompt() для показа диалога.
                 */
                const promptEvent = (window as any).deferredPrompt;
                if (promptEvent) {
                  promptEvent.prompt();
                }
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Установить сейчас
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
