BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "notification"
  ADD COLUMN "globalChatMessageId" TEXT,
  ADD COLUMN "commentText" TEXT,
  ADD COLUMN "emotion" TEXT;

ALTER TABLE "notification"
  ADD CONSTRAINT "notification_globalChatMessageId_fkey"
  FOREIGN KEY ("globalChatMessageId") REFERENCES "global-chat-message"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
