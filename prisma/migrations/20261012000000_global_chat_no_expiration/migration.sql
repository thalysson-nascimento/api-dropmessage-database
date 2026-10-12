-- Global chat messages do not expire. Keep timed feed posts unchanged.
UPDATE "global-chat-message" SET "expiresAt" = NULL WHERE "expiresAt" IS NOT NULL;

-- Cancel only pending expiry cleanup for still-published chat images.
-- Already-deleted provider assets cannot be recovered by this migration.
UPDATE "direct-upload-session" AS s
SET "status" = 'PUBLISHED', "rejectionReason" = NULL,
    "cleanupPending" = false, "cleanupPublicId" = NULL
FROM "global-chat-message" AS m
WHERE s."messageId" = m.id AND m."deletedAt" IS NULL
  AND s.purpose = 'GLOBAL_CHAT_IMAGE' AND s.status = 'EXPIRED'
  AND s."rejectionReason" = 'UPLOAD_EXPIRED' AND s."cleanupPending" = true
  AND s."cleanupPublicId" IS NULL
  AND s."cleanupResourceType" = 'image' AND s."cleanupDeliveryType" = 'authenticated';
