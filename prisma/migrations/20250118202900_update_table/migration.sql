/*
  Warnings:

  - You are about to drop the column `currentPriodEnd` on the `stripe-signature` table. All the data in the column will be lost.
  - You are about to drop the column `currentPriodStart` on the `stripe-signature` table. All the data in the column will be lost.
  - Added the required column `currentPeriodEnd` to the `stripe-signature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentPeriodStart` to the `stripe-signature` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stripe-signature" DROP COLUMN "currentPriodEnd",
DROP COLUMN "currentPriodStart",
ADD COLUMN     "currentPeriodEnd" INTEGER NOT NULL,
ADD COLUMN     "currentPeriodStart" INTEGER NOT NULL,
ALTER COLUMN "canceledAt" DROP NOT NULL;
