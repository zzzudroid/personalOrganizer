/**
 * @file Глобальный экземпляр Prisma Client
 * @description Создает и экспортирует единственный (singleton) экземпляр PrismaClient
 * для взаимодействия с PostgreSQL базой данных (Neon).
 *
 * Проблема: В режиме разработки Next.js выполняет hot-reload модулей,
 * что приводит к созданию нового PrismaClient при каждой перезагрузке.
 * Это быстро исчерпывает лимит подключений к БД.
 *
 * Решение: Сохраняем экземпляр PrismaClient в globalThis (глобальный объект Node.js),
 * который не очищается при hot-reload. В production это не нужно, так как
 * модули загружаются один раз.
 *
 * Паттерн рекомендован в документации Prisma:
 * https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client"

/**
 * Расширяем тип globalThis для хранения экземпляра PrismaClient.
 * Используем unknown + приведение типов, так как globalThis не имеет свойства prisma по умолчанию.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Единственный экземпляр PrismaClient для всего приложения.
 * Если экземпляр уже существует в globalThis — используем его.
 * Если нет — создаем новый.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// В режиме разработки сохраняем экземпляр в globalThis для переиспользования при hot-reload.
// В production это не нужно — модуль загружается один раз.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
