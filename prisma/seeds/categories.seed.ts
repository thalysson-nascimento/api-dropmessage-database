import { PrismaClient } from "@prisma/client";

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    { name: "sports" },
    { name: "music" },
    { name: "lifestyle" },
    { name: "technology" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log("✅ Categories seeded");
}
