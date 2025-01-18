/*
  Warnings:

  - Made the column `status` on table `stripe-signature` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "stripe-signature" ALTER COLUMN "status" SET NOT NULL;
