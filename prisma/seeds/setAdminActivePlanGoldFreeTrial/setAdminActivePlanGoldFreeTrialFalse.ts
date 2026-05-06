import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.adminActivePlanGoldFreeTrial.updateMany({
    data: { activePlan: false },
  });
  console.log("Todos os registros de activePlan foram setados para false.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
