/*
  Warnings:

  - You are about to drop the column `languageId` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `language` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `language` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_languageId_fkey";

-- AlterTable
ALTER TABLE "language" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "languageId";

-- CreateIndex
CREATE UNIQUE INDEX "language_userId_key" ON "language"("userId");

-- AddForeignKey
ALTER TABLE "language" ADD CONSTRAINT "language_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
