-- CreateTable
CREATE TABLE "UserDescription" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceInfo" (
    "id" SERIAL NOT NULL,
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

    CONSTRAINT "DeviceInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDescription_userId_key" ON "UserDescription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceInfo_userId_key" ON "DeviceInfo"("userId");

-- AddForeignKey
ALTER TABLE "UserDescription" ADD CONSTRAINT "UserDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceInfo" ADD CONSTRAINT "DeviceInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
