/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `reward_tracking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "reward_tracking_userId_key" ON "reward_tracking"("userId");
