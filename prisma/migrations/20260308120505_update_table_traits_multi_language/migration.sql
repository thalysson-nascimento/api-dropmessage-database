/*
  Warnings:

  - You are about to drop the column `name` on the `ai_trait` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ai_trait" DROP COLUMN "name";

-- CreateTable
CREATE TABLE "ai_trait_translation" (
    "id" TEXT NOT NULL,
    "traitId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ai_trait_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_trait_translation_traitId_locale_key" ON "ai_trait_translation"("traitId", "locale");

-- AddForeignKey
ALTER TABLE "ai_trait_translation" ADD CONSTRAINT "ai_trait_translation_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "ai_trait"("id") ON DELETE CASCADE ON UPDATE CASCADE;
