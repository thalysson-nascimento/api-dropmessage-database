import { PrismaClient } from "@prisma/client";
import { seedDavidAI } from "./profiles/sophia/david.seed";
import { seedSophiaAI } from "./profiles/sophia/sophia.seed";
import { seedTraits } from "./traits/traits.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  await seedTraits(prisma);
  await seedSophiaAI(prisma);
  await seedDavidAI(prisma);

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
