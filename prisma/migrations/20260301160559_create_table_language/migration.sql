-- AlterTable
ALTER TABLE "user" ADD COLUMN     "languageId" TEXT;

-- CreateTable
CREATE TABLE "language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE SET NULL ON UPDATE CASCADE;
