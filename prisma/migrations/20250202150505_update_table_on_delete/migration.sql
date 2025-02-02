-- DropForeignKey
ALTER TABLE "PostMessageCloudinary" DROP CONSTRAINT "PostMessageCloudinary_userId_fkey";

-- DropForeignKey
ALTER TABLE "about-me" DROP CONSTRAINT "about-me_userId_fkey";

-- DropForeignKey
ALTER TABLE "complete-data" DROP CONSTRAINT "complete-data_userId_fkey";

-- DropForeignKey
ALTER TABLE "device-info" DROP CONSTRAINT "device-info_userId_fkey";

-- DropForeignKey
ALTER TABLE "like-post-message" DROP CONSTRAINT "like-post-message_postId_fkey";

-- DropForeignKey
ALTER TABLE "like-post-message" DROP CONSTRAINT "like-post-message_userId_fkey";

-- DropForeignKey
ALTER TABLE "match" DROP CONSTRAINT "match_initiatorId_fkey";

-- DropForeignKey
ALTER TABLE "match" DROP CONSTRAINT "match_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_matchId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_userId_fkey";

-- DropForeignKey
ALTER TABLE "reward_tracking" DROP CONSTRAINT "reward_tracking_userId_fkey";

-- DropForeignKey
ALTER TABLE "stripe-signature" DROP CONSTRAINT "stripe-signature_userId_fkey";

-- DropForeignKey
ALTER TABLE "unlike-post-message" DROP CONSTRAINT "unlike-post-message_postId_fkey";

-- DropForeignKey
ALTER TABLE "unlike-post-message" DROP CONSTRAINT "unlike-post-message_userId_fkey";

-- DropForeignKey
ALTER TABLE "user-description" DROP CONSTRAINT "user-description_userId_fkey";

-- DropForeignKey
ALTER TABLE "user-location" DROP CONSTRAINT "user-location_userId_fkey";

-- AddForeignKey
ALTER TABLE "user-description" ADD CONSTRAINT "user-description_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device-info" ADD CONSTRAINT "device-info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user-location" ADD CONSTRAINT "user-location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about-me" ADD CONSTRAINT "about-me_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMessageCloudinary" ADD CONSTRAINT "PostMessageCloudinary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complete-data" ADD CONSTRAINT "complete-data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like-post-message" ADD CONSTRAINT "like-post-message_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostMessageCloudinary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like-post-message" ADD CONSTRAINT "like-post-message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlike-post-message" ADD CONSTRAINT "unlike-post-message_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostMessageCloudinary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlike-post-message" ADD CONSTRAINT "unlike-post-message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_tracking" ADD CONSTRAINT "reward_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe-signature" ADD CONSTRAINT "stripe-signature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
