"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Download, Bell, Wifi, CheckCircle } from "lucide-react";

interface PWAInstallGuideProps {
  onClose: () => void;
}

export default function PWAInstallGuide({ onClose }: PWAInstallGuideProps) {
  const [platform, setPlatform] = useState<string>("");
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Определяем платформу
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

    // Проверяем, можно ли установить
    if ("serviceWorker" in navigator && "beforeinstallprompt" in window) {
      setIsInstallable(true);
    }
  }, []);

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

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="w-6 h-6" />
              Установить приложение
            </h2>
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

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Download className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">Иконка на рабочем столе</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Wifi className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">Работает без интернета</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-800">Push-уведомления</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-800">Быстрый запуск</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-5 mb-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                {platform === "ios" ? "🍎" : platform === "android" ? "🤖" : "💻"}
              </span>
              {instructions.title}
            </h3>
            <ol className="space-y-3">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Note */}
          <p className="text-sm text-gray-500 text-center mb-6">
            {instructions.note}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Позже
            </button>
            <button
              onClick={() => {
                // Пытаемся вызвать установку
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
