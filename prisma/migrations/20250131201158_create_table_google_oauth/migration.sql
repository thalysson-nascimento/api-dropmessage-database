-- AlterTable
ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "oauth-google" (
    "id" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth-google_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth-google_userId_key" ON "oauth-google"("userId");

-- AddForeignKey
ALTER TABLE "oauth-google" ADD CONSTRAINT "oauth-google_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
