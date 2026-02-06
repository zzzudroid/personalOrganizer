import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const categories = [
    { name: "Работа", color: "#3b82f6" },
    { name: "Личное", color: "#10b981" },
    { name: "Учеба", color: "#f59e0b" },
    { name: "Здоровье", color: "#ef4444" },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log("Категории созданы")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
