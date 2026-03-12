import { PrismaClient } from "@prisma/client";

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    { name: "sports" },
    { name: "fitness" },
    { name: "music" },
    { name: "dance" },
    { name: "food_drink" },
    { name: "nightlife" },
    { name: "travel" },
    { name: "fashion" },
    { name: "technology" },
    { name: "social" },
    { name: "wellness" },
    { name: "entertainment" },
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
