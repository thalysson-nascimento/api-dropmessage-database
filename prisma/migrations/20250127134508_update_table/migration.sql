-- DropForeignKey
ALTER TABLE "subscription-plan-gold-free-trial" DROP CONSTRAINT "subscription-plan-gold-free-trial_userId_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "ActivePlanGolFreeTrial" BOOLEAN;

-- AddForeignKey
ALTER TABLE "subscription-plan-gold-free-trial" ADD CONSTRAINT "subscription-plan-gold-free-trial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
