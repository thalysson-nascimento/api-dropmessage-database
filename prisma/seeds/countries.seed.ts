import { PrismaClient } from "@prisma/client";

export async function seedCountries(prisma: PrismaClient) {
  const countries = [
    { code: "BR", name: "Brazil" },
    { code: "US", name: "United States" },
    // { code: 'CA', name: 'Canada' },
    // { code: 'PT', name: 'Portugal' }
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
      },
      create: country,
    });
  }

  console.log("✅ Countries seeded");
}
