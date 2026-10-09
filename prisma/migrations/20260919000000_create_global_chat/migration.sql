-- CreateEnum
CREATE TYPE "GlobalChatMessageType" AS ENUM ('TEXT', 'IMAGE');

-- CreateTable
CREATE TABLE "global-chat-message" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "type" "GlobalChatMessageType" NOT NULL,
    "image" TEXT,
    "fileName" TEXT,
    "format" TEXT,
    "optimizedSize" INTEGER,
    "viewOnce" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global-chat-message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global-chat-reaction" (
    "id" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global-chat-reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global-chat-comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global-chat-comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global-chat-message-view" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global-chat-message-view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "global-chat-message_createdAt_idx" ON "global-chat-message"("createdAt");
CREATE INDEX "global-chat-message_expiresAt_idx" ON "global-chat-message"("expiresAt");
CREATE UNIQUE INDEX "global-chat-reaction_messageId_userId_emotion_key" ON "global-chat-reaction"("messageId", "userId", "emotion");
CREATE INDEX "global-chat-reaction_messageId_emotion_idx" ON "global-chat-reaction"("messageId", "emotion");
CREATE INDEX "global-chat-comment_messageId_createdAt_idx" ON "global-chat-comment"("messageId", "createdAt");
CREATE UNIQUE INDEX "global-chat-message-view_messageId_userId_key" ON "global-chat-message-view"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "global-chat-message" ADD CONSTRAINT "global-chat-message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global-chat-message" ADD CONSTRAINT "global-chat-message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "global-chat-message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "global-chat-reaction" ADD CONSTRAINT "global-chat-reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "global-chat-message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global-chat-reaction" ADD CONSTRAINT "global-chat-reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global-chat-comment" ADD CONSTRAINT "global-chat-comment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "global-chat-message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global-chat-comment" ADD CONSTRAINT "global-chat-comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global-chat-comment" ADD CONSTRAINT "global-chat-comment_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "global-chat-comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "global-chat-message-view" ADD CONSTRAINT "global-chat-message-view_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "global-chat-message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global-chat-message-view" ADD CONSTRAINT "global-chat-message-view_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
