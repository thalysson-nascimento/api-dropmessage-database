import { PrismaClient } from "@prisma/client";
import { seedCategories } from "./categories.seed";
import { seedCountries } from "./countries.seed";
import { seedHobbies } from "./hobbies.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  await seedCountries(prisma);
  await seedCategories(prisma);
  await seedHobbies(prisma);

  console.log("🌱 Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
