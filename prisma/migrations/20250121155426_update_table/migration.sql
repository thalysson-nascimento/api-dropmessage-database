/*
  Warnings:

  - You are about to drop the column `timerInvoice` on the `stripe-signature` table. All the data in the column will be lost.
  - Added the required column `interval` to the `stripe-signature` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stripe-signature" DROP COLUMN "timerInvoice",
ADD COLUMN     "interval" TEXT NOT NULL;
