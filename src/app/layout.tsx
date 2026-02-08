import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Organizer",
  description: "Your personal task and calendar organizer",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-6">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
            >
              Календарь
            </Link>
            <Link
              href="/finances"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
            >
              Финансы
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
