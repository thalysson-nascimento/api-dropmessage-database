/*
  Warnings:

  - You are about to drop the `like` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "like" DROP CONSTRAINT "like_postId_fkey";

-- DropForeignKey
ALTER TABLE "like" DROP CONSTRAINT "like_userId_fkey";

-- DropTable
DROP TABLE "like";

-- CreateTable
CREATE TABLE "like-post-message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "like-post-message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "like-post-message_postId_userId_key" ON "like-post-message"("postId", "userId");

-- AddForeignKey
ALTER TABLE "like-post-message" ADD CONSTRAINT "like-post-message_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post-message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like-post-message" ADD CONSTRAINT "like-post-message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
