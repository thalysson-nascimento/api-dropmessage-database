import { PrismaClient } from "@prisma/client";
import { aiTraits } from "./traits.const";

export async function seedTraits(prisma: PrismaClient) {
  for (const trait of aiTraits) {
    const createdTrait = await prisma.aITrait.upsert({
      where: { key: trait.key },
      update: {},
      create: {
        key: trait.key,
      },
    });

    for (const [locale, name] of Object.entries(trait.translations)) {
      await prisma.aITraitTranslation.upsert({
        where: {
          traitId_locale: {
            traitId: createdTrait.id,
            locale,
          },
        },
        update: { name },
        create: {
          traitId: createdTrait.id,
          locale,
          name,
        },
      });
    }
  }

  console.log("✅ AI Traits seeded");
}
