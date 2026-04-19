-- AlterTable
ALTER TABLE "reward_tracking" ADD COLUMN     "cycleExpiresAt" TIMESTAMP(3),
ADD COLUMN     "limitReached" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rewardLikesAvailable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rewardWatchCount" INTEGER NOT NULL DEFAULT 0;
