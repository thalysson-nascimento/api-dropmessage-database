/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `avatar` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "avatar_userId_key" ON "avatar"("userId");
