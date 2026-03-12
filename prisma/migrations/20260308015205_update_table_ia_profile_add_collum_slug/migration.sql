/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `ai_profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `ai_profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ai_profile" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ai_profile_slug_key" ON "ai_profile"("slug");
