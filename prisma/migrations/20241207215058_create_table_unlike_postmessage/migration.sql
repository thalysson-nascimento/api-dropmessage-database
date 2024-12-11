-- CreateTable
CREATE TABLE "unlike-post-message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "unlike-post-message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unlike-post-message_postId_userId_key" ON "unlike-post-message"("postId", "userId");

-- AddForeignKey
ALTER TABLE "unlike-post-message" ADD CONSTRAINT "unlike-post-message_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostMessageCloudinary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlike-post-message" ADD CONSTRAINT "unlike-post-message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
