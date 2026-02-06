import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Organizer",
  description: "Your personal task and calendar organizer",
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
        {children}
      </body>
    </html>
  );
}
