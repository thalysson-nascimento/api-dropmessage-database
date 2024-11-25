/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `AvatarCloudinary` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AvatarCloudinary" DROP CONSTRAINT "AvatarCloudinary_userId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "AvatarCloudinary_userId_key" ON "AvatarCloudinary"("userId");

-- AddForeignKey
ALTER TABLE "AvatarCloudinary" ADD CONSTRAINT "AvatarCloudinary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
