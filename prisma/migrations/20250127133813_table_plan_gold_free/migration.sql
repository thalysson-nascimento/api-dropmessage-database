-- CreateTable
CREATE TABLE "subscription-plan-gold-free-trial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewCardFreeTrial" BOOLEAN DEFAULT false,
    "firstPublicationPostMessage" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription-plan-gold-free-trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active-plan-gold-free-trial" (
    "id" TEXT NOT NULL,
    "activePlan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "active-plan-gold-free-trial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subscription-plan-gold-free-trial" ADD CONSTRAINT "subscription-plan-gold-free-trial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
