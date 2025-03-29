-- DropForeignKey
ALTER TABLE "subscription-gold-free-trial" DROP CONSTRAINT "subscription-gold-free-trial_userId_fkey";

-- CreateTable
CREATE TABLE "logged-user" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logged-user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "logged-user_userId_key" ON "logged-user"("userId");

-- CreateIndex
CREATE INDEX "logged-user_userId_idx" ON "logged-user"("userId");

-- AddForeignKey
ALTER TABLE "subscription-gold-free-trial" ADD CONSTRAINT "subscription-gold-free-trial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logged-user" ADD CONSTRAINT "logged-user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
