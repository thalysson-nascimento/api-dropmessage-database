/*
  Warnings:

  - You are about to drop the `DeviceInfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserDescription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DeviceInfo" DROP CONSTRAINT "DeviceInfo_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDescription" DROP CONSTRAINT "UserDescription_userId_fkey";

-- DropTable
DROP TABLE "DeviceInfo";

-- DropTable
DROP TABLE "UserDescription";

-- CreateTable
CREATE TABLE "user-description" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user-description_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device-info" (
    "id" TEXT NOT NULL,
    "operatingSystem" TEXT NOT NULL,
    "operatingSystemVersion" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceModel" TEXT NOT NULL,
    "screenResolution" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceLanguage" TEXT NOT NULL,
    "networkConnection" TEXT NOT NULL,
    "deviceTemperature" DOUBLE PRECISION NOT NULL,
    "deviceRegion" TEXT NOT NULL,
    "apiLevel" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device-info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user-description_userId_key" ON "user-description"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "device-info_userId_key" ON "device-info"("userId");

-- AddForeignKey
ALTER TABLE "user-description" ADD CONSTRAINT "user-description_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device-info" ADD CONSTRAINT "device-info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
