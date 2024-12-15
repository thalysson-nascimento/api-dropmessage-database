/*
  Warnings:

  - Changed the type of `codeConfirmation` on the `code-confirmation-email` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "code-confirmation-email" DROP COLUMN "codeConfirmation",
ADD COLUMN     "codeConfirmation" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "code-confirmation-email_codeConfirmation_key" ON "code-confirmation-email"("codeConfirmation");
