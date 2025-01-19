/*
  Warnings:

  - You are about to drop the column `idSignature` on the `stripe-signature` table. All the data in the column will be lost.
  - You are about to drop the column `unitAmountDecimal` on the `stripe-signature` table. All the data in the column will be lost.
  - You are about to drop the `signature-plan` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[subscription]` on the table `stripe-signature` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amountPaid` to the `stripe-signature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscription` to the `stripe-signature` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "signature-plan" DROP CONSTRAINT "signature-plan_userId_fkey";

-- DropIndex
DROP INDEX "stripe-signature_idSignature_key";

-- AlterTable
ALTER TABLE "stripe-signature" DROP COLUMN "idSignature",
DROP COLUMN "unitAmountDecimal",
ADD COLUMN     "amountPaid" INTEGER NOT NULL,
ADD COLUMN     "subscription" TEXT NOT NULL;

-- DropTable
DROP TABLE "signature-plan";

-- CreateIndex
CREATE UNIQUE INDEX "stripe-signature_subscription_key" ON "stripe-signature"("subscription");
