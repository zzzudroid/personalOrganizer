/**
 * @file Корневой layout приложения (Root Layout)
 * @description Определяет общую HTML-структуру для всех страниц приложения.
 * Включает:
 * - Метаданные (title, description, manifest для PWA, иконки)
 * - Настройки viewport для мобильных устройств
 * - Глобальные стили (globals.css + Tailwind CSS через CDN)
 * - Навигационную панель с ссылками на разделы приложения
 *
 * Это Server Component (без "use client"), так как не содержит интерактивной логики.
 * Next.js App Router требует layout.tsx в корне app/ для оборачивания всех страниц.
 */

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

/**
 * Метаданные приложения для SEO и PWA.
 * Next.js автоматически генерирует <head> теги из этого объекта.
 * - manifest: путь к файлу манифеста PWA (для установки на устройство)
 * - icons: иконки приложения (для вкладки браузера и домашнего экрана)
 */
export const metadata: Metadata = {
  title: "Personal Organizer",
  description: "Your personal task and calendar organizer",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",   // Иконка для вкладки браузера
    apple: "/icons/icon.svg",  // Иконка для iOS (Add to Home Screen)
  },
};

/**
 * Настройки viewport для мобильных устройств.
 * - themeColor: цвет статус-бара на мобильных (синий, в тон приложению)
 * - maximumScale: 1 + userScalable: false — запрет масштабирования для нативного UX
 */
export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Корневой layout — оборачивает все страницы приложения.
 *
 * Структура:
 * 1. <html lang="ru"> — русская локаль для корректной работы скринридеров
 * 2. Tailwind CSS подключен через CDN (для быстрой разработки)
 * 3. Навигационная панель (nav) с ссылками на разделы:
 *    - "Календарь" (/) — главная страница с задачами и календарем
 *    - "Финансы" (/finances) — финансовый дашборд
 * 4. {children} — содержимое текущей страницы (page.tsx)
 *
 * @param {object} props - свойства компонента
 * @param {React.ReactNode} props.children - содержимое текущей страницы
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Tailwind CSS подключен через CDN для быстрой загрузки стилей */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* Навигационная панель — общая для всех страниц */}
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-6">
            {/* Ссылка на главную страницу (календарь с задачами) */}
            <Link
              href="/"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
            >
              Календарь
            </Link>
            {/* Ссылка на финансовый дашборд */}
            <Link
              href="/finances"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
            >
              Финансы
            </Link>
          </div>
        </nav>
        {/* Содержимое текущей страницы (определяется файлом page.tsx) */}
        {children}
      </body>
    </html>
  );
}
