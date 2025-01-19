/*
  Warnings:

  - Added the required column `continent` to the `user-location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `user-location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryCode` to the `user-location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `user-location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user-location" ADD COLUMN     "continent" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "countryCode" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL;
