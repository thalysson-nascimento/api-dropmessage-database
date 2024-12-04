/*
  Warnings:

  - You are about to drop the column `watchedVideoReward` on the `reward_tracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reward_tracking" DROP COLUMN "watchedVideoReward",
ADD COLUMN     "mustWatchVideoReword" BOOLEAN NOT NULL DEFAULT false;
