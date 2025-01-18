/*
  Warnings:

  - You are about to drop the column `statusExpirationPlan` on the `stripe-signature` table. All the data in the column will be lost.
  - Added the required column `active` to the `stripe-signature` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stripe-signature" DROP COLUMN "statusExpirationPlan",
ADD COLUMN     "active" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "signature-plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature-plan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "signature-plan" ADD CONSTRAINT "signature-plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
