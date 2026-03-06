import { PrismaClient } from "@prisma/client";
import { hobbies } from "./hobbies.const";

export async function seedHobbies(prisma: PrismaClient) {
  for (const hobbyData of hobbies) {
    const category = await prisma.category.findUnique({
      where: { name: hobbyData.category },
    });

    if (!category) {
      throw new Error(`Category ${hobbyData.category} not found`);
    }

    const hobby = await prisma.hobby.upsert({
      where: { key: hobbyData.key },
      update: {
        icon: hobbyData.icon,
        color: hobbyData.color,
        categoryId: category.id,
      },
      create: {
        key: hobbyData.key,
        icon: hobbyData.icon,
        color: hobbyData.color,
        categoryId: category.id,
      },
    });

    // Traduções
    for (const [language, name] of Object.entries(hobbyData.translations)) {
      await prisma.hobbyTranslation.upsert({
        where: {
          hobbyId_language: {
            hobbyId: hobby.id,
            language,
          },
        },
        update: { name },
        create: {
          hobbyId: hobby.id,
          language,
          name,
        },
      });
    }

    // Relação com países
    for (const countryCode of hobbyData.countries) {
      const country = await prisma.country.findUnique({
        where: { code: countryCode },
      });

      if (!country) {
        throw new Error(`Country ${countryCode} not found`);
      }

      await prisma.hobbyCountry.upsert({
        where: {
          hobbyId_countryId: {
            hobbyId: hobby.id,
            countryId: country.id,
          },
        },
        update: {},
        create: {
          hobbyId: hobby.id,
          countryId: country.id,
        },
      });
    }
  }

  console.log("✅ Hobbies seeded");
}
