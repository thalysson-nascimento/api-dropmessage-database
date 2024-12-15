-- CreateTable
CREATE TABLE "code-confirmation-email" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeConfirmation" TEXT NOT NULL,

    CONSTRAINT "code-confirmation-email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "code-confirmation-email_userId_key" ON "code-confirmation-email"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "code-confirmation-email_codeConfirmation_key" ON "code-confirmation-email"("codeConfirmation");

-- AddForeignKey
ALTER TABLE "code-confirmation-email" ADD CONSTRAINT "code-confirmation-email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
