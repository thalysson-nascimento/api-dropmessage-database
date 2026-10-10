BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
CREATE TABLE "direct-upload-session" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "purpose" TEXT NOT NULL,
  "clientRequestId" TEXT NOT NULL, "publicId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', "fileName" TEXT NOT NULL,
  "declaredBytes" INTEGER NOT NULL, "requestHash" TEXT NOT NULL, "content" TEXT, "replyToId" TEXT,
  "viewOnce" BOOLEAN NOT NULL DEFAULT false, "expirationSeconds" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "messageId" TEXT, "assetId" TEXT,
  "rejectionReason" TEXT, "cleanupPending" BOOLEAN NOT NULL DEFAULT false,
  "cleanupResourceType" TEXT NOT NULL DEFAULT 'image', "cleanupDeliveryType" TEXT NOT NULL DEFAULT 'authenticated', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "direct-upload-session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "direct-upload-session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "direct-upload-session_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "global-chat-message"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "direct-upload-session_publicId_key" ON "direct-upload-session"("publicId");
CREATE UNIQUE INDEX "direct-upload-session_messageId_key" ON "direct-upload-session"("messageId");
CREATE UNIQUE INDEX "direct-upload-session_userId_purpose_clientRequestId_key" ON "direct-upload-session"("userId", "purpose", "clientRequestId");
CREATE INDEX "direct-upload-session_userId_status_expiresAt_idx" ON "direct-upload-session"("userId", "status", "expiresAt");
CREATE INDEX "direct-upload-session_userId_createdAt_idx" ON "direct-upload-session"("userId", "createdAt");
CREATE INDEX "direct-upload-session_cleanupPending_updatedAt_idx" ON "direct-upload-session"("cleanupPending", "updatedAt");
CREATE INDEX "direct-upload-session_status_idx" ON "direct-upload-session"("status");
COMMIT;
