/*
  Warnings:

  - You are about to drop the column `canceledAt` on the `stripe-signature` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stripe-signature" DROP COLUMN "canceledAt",
ADD COLUMN     "cancelAt" INTEGER;
