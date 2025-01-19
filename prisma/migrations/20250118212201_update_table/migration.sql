/*
  Warnings:

  - You are about to drop the column `statusCanceled` on the `stripe-signature` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stripe-signature" DROP COLUMN "statusCanceled",
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
