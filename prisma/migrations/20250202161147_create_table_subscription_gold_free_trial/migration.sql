/*
  Warnings:

  - You are about to drop the `subscription-plan-gold-free-trial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "subscription-plan-gold-free-trial" DROP CONSTRAINT "subscription-plan-gold-free-trial_userId_fkey";

-- DropTable
DROP TABLE "subscription-plan-gold-free-trial";

-- CreateTable
CREATE TABLE "ViewCardOrFirstPublicationPlanGoldFreeTrial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewCardFreeTrial" BOOLEAN DEFAULT false,
    "firstPublicationPostMessage" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewCardOrFirstPublicationPlanGoldFreeTrial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription-gold-free-trial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription-gold-free-trial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViewCardOrFirstPublicationPlanGoldFreeTrial_userId_key" ON "ViewCardOrFirstPublicationPlanGoldFreeTrial"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription-gold-free-trial_userId_key" ON "subscription-gold-free-trial"("userId");

-- AddForeignKey
ALTER TABLE "ViewCardOrFirstPublicationPlanGoldFreeTrial" ADD CONSTRAINT "ViewCardOrFirstPublicationPlanGoldFreeTrial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription-gold-free-trial" ADD CONSTRAINT "subscription-gold-free-trial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
