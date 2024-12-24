/*
  Warnings:

  - The primary key for the `DeviceInfo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserDescription` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "DeviceInfo" DROP CONSTRAINT "DeviceInfo_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DeviceInfo_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DeviceInfo_id_seq";

-- AlterTable
ALTER TABLE "UserDescription" DROP CONSTRAINT "UserDescription_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserDescription_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserDescription_id_seq";
