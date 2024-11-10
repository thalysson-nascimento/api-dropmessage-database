-- AlterTable
ALTER TABLE "user" ADD COLUMN     "validatorLocation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user-location" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user-location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about-me" (
    "id" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "about-me_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user-location_userId_key" ON "user-location"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "about-me_userId_key" ON "about-me"("userId");

-- AddForeignKey
ALTER TABLE "user-location" ADD CONSTRAINT "user-location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about-me" ADD CONSTRAINT "about-me_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
