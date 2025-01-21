/*
  Warnings:

  - Added the required column `intervalCount` to the `stripe-signature` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stripe-signature" ADD COLUMN     "intervalCount" INTEGER NOT NULL;
