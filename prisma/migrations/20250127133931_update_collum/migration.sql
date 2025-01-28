/*
  Warnings:

  - Changed the type of `activePlan` on the `active-plan-gold-free-trial` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "active-plan-gold-free-trial" DROP COLUMN "activePlan",
ADD COLUMN     "activePlan" BOOLEAN NOT NULL;
