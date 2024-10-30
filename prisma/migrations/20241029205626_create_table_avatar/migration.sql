/*
  Warnings:

  - You are about to drop the column `imageAvatar` on the `complete-data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "complete-data" DROP COLUMN "imageAvatar";

-- CreateTable
CREATE TABLE "avatar" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "avatar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "avatar" ADD CONSTRAINT "avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
