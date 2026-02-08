/**
 * @file API-маршрут для работы с задачами (коллекция)
 * @description Обрабатывает GET (получение списка всех задач) и POST (создание новой задачи).
 * Все задачи хранятся в PostgreSQL и доступны через Prisma ORM.
 * Связанные данные (категория, подзадачи) подгружаются автоматически через include.
 *
 * Эндпоинт: /api/tasks
 * Методы: GET, POST
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Получает список всех задач из базы данных.
 *
 * Возвращает задачи с включенными связями:
 * - category: категория задачи (если назначена)
 * - subtasks: список подзадач, отсортированных по sortOrder
 *
 * Задачи отсортированы по полю sortOrder (по возрастанию) для корректного
 * отображения пользовательского порядка после drag & drop.
 *
 * @returns {Promise<NextResponse>} JSON-массив задач или ошибка 500
 */
export async function GET() {
  try {
    // Получаем все задачи с включением связанных моделей (категория и подзадачи)
    const tasks = await prisma.task.findMany({
      include: {
        category: true, // Подгружаем связанную категорию
        subtasks: {
          orderBy: {
            sortOrder: "asc" // Подзадачи отсортированы по пользовательскому порядку
          }
        }
      },
      orderBy: {
        sortOrder: "asc" // Задачи отсортированы по пользовательскому порядку
      }
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Ошибка при получении задач:", error)
    return NextResponse.json(
      { error: "Не удалось получить задачи" },
      { status: 500 }
    )
  }
}

/**
 * Создает новую задачу в базе данных.
 *
 * Принимает JSON-тело запроса с полями:
 * - title (string, обязательно): заголовок задачи
 * - description (string, опционально): описание задачи
 * - status (string, по умолчанию "todo"): статус задачи ("todo", "in_progress", "done")
 * - priority (string, по умолчанию "medium"): приоритет ("low", "medium", "high")
 * - sortOrder (number, по умолчанию 0): порядок сортировки для drag & drop
 * - dueDate (string, опционально): дата выполнения в формате "yyyy-MM-dd"
 * - categoryId (string, опционально): ID связанной категории
 *
 * @param {Request} request - входящий HTTP-запрос с JSON-телом
 * @returns {Promise<NextResponse>} Созданная задача (статус 201) или ошибка 500
 */
export async function POST(request: Request) {
  try {
    // Извлекаем данные из тела запроса
    const body = await request.json()
    const { title, description, status, priority, sortOrder, dueDate, categoryId } = body

    // Создаем задачу в БД с значениями по умолчанию для необязательных полей
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "todo",       // По умолчанию задача в статусе "todo"
        priority: priority || "medium",  // По умолчанию средний приоритет
        sortOrder: sortOrder || 0,       // По умолчанию в начало списка
        dueDate,
        categoryId: categoryId || null   // Категория необязательна
      },
      include: {
        category: true // Возвращаем задачу вместе с категорией
      }
    })

    // Возвращаем созданную задачу со статусом 201 (Created)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании задачи:", error)
    return NextResponse.json(
      { error: "Не удалось создать задачу" },
      { status: 500 }
    )
  }
}
