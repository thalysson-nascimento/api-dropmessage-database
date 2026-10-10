-- Make room for image-only messages while preserving existing text messages.
ALTER TABLE "message"
  ALTER COLUMN "content" DROP NOT NULL,
  ADD COLUMN "image" TEXT,
  ADD COLUMN "fileName" TEXT,
  ADD COLUMN "format" TEXT,
  ADD COLUMN "viewOnce" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "private-message-view" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "private-message-view_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "private-message-view_messageId_userId_key"
  ON "private-message-view"("messageId", "userId");
CREATE INDEX "private-message-view_messageId_idx"
  ON "private-message-view"("messageId");

ALTER TABLE "private-message-view"
  ADD CONSTRAINT "private-message-view_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "message"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "private-message-view"
  ADD CONSTRAINT "private-message-view_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
