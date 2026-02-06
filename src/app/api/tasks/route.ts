import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        category: true,
        tags: true,
      },
      orderBy: {
        order: "asc",
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, dueDate, categoryId, tagIds } = body;

    const maxOrder = await prisma.task.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "medium",
        order: (maxOrder?.order ?? -1) + 1,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId,
        tags: tagIds ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
      include: {
        category: true,
        tags: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
