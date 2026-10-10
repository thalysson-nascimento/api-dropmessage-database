BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE "user" ADD COLUMN "avatarUploadRevision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AvatarCloudinary" ADD COLUMN "thumbnail" TEXT, ADD COLUMN "thumbnailVersion" INTEGER;
ALTER TABLE "message" ADD COLUMN "mediaUploadId" TEXT;
CREATE UNIQUE INDEX "message_mediaUploadId_key" ON "message"("mediaUploadId");
ALTER TABLE "direct-upload-session" ADD COLUMN "metadata" JSONB, ADD COLUMN "resourceId" TEXT, ADD COLUMN "result" JSONB, ADD COLUMN "avatarRevision" INTEGER, ADD COLUMN "cleanupPublicId" TEXT;
CREATE TABLE "direct-upload-asset" (
 "id" TEXT NOT NULL PRIMARY KEY, "sessionId" TEXT NOT NULL, "role" TEXT NOT NULL,
 "publicId" TEXT NOT NULL, "fileName" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "declaredBytes" INTEGER NOT NULL,
 "assetId" TEXT, "format" TEXT, "bytes" INTEGER, "width" INTEGER, "height" INTEGER, "version" INTEGER,
 "uploadedAt" TIMESTAMP(3), "confirmedAt" TIMESTAMP(3), "cleanupPending" BOOLEAN NOT NULL DEFAULT false,
 "cleanupResourceType" TEXT NOT NULL DEFAULT 'image', "cleanupDeliveryType" TEXT NOT NULL DEFAULT 'authenticated',
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "direct-upload-asset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "direct-upload-session"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "direct-upload-asset_publicId_key" ON "direct-upload-asset"("publicId");
CREATE UNIQUE INDEX "direct-upload-asset_sessionId_role_key" ON "direct-upload-asset"("sessionId", "role");
CREATE INDEX "direct-upload-asset_cleanupPending_updatedAt_idx" ON "direct-upload-asset"("cleanupPending", "updatedAt");
CREATE TABLE "media-upload-effect" (
 "id" TEXT NOT NULL PRIMARY KEY, "sessionId" TEXT NOT NULL, "kind" TEXT NOT NULL, "payload" JSONB NOT NULL,
 "done" BOOLEAN NOT NULL DEFAULT false, "attempts" INTEGER NOT NULL DEFAULT 0,
 "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "media-upload-effect_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "direct-upload-session"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "media-upload-effect_sessionId_kind_key" ON "media-upload-effect"("sessionId", "kind");
CREATE INDEX "media-upload-effect_done_nextAttemptAt_idx" ON "media-upload-effect"("done", "nextAttemptAt");
CREATE TABLE "media-cleanup-task" (
 "id" TEXT NOT NULL PRIMARY KEY, "publicId" TEXT NOT NULL,
 "resourceType" TEXT NOT NULL DEFAULT 'image', "deliveryType" TEXT NOT NULL DEFAULT 'authenticated',
 "pending" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "media-cleanup-task_publicId_resourceType_deliveryType_key" ON "media-cleanup-task"("publicId", "resourceType", "deliveryType");
CREATE INDEX "media-cleanup-task_pending_updatedAt_idx" ON "media-cleanup-task"("pending", "updatedAt");
COMMIT;
