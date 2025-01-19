/*
  Warnings:

  - A unique constraint covering the columns `[idSignature]` on the table `stripe-signature` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "stripe-signature_idSignature_key" ON "stripe-signature"("idSignature");
