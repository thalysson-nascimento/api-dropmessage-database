-- CreateTable
CREATE TABLE "user-stripe-customers-id" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user-stripe-customers-id_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user-stripe-customers-id_userId_key" ON "user-stripe-customers-id"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user-stripe-customers-id_customerId_key" ON "user-stripe-customers-id"("customerId");

-- AddForeignKey
ALTER TABLE "user-stripe-customers-id" ADD CONSTRAINT "user-stripe-customers-id_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
