import { prisma } from "@/lib/db";

async function main() {
  // Создаем начальные категории
  const categories = await prisma.category.createMany({
    data: [
      { name: "Работа", color: "#3b82f6" },
      { name: "Личное", color: "#10b981" },
      { name: "Учеба", color: "#f59e0b" },
      { name: "Здоровье", color: "#ef4444" },
    ],
    skipDuplicates: true,
  });

  // Создаем теги
  const tags = await prisma.tag.createMany({
    data: [
      { name: "срочно", color: "#dc2626" },
      { name: "важно", color: "#ea580c" },
      { name: "позже", color: "#6b7280" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Database seeded successfully!");
  console.log(`Created ${categories.count} categories`);
  console.log(`Created ${tags.count} tags`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
