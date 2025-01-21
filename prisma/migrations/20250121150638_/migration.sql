-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "userHashPublic" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isDeactivated" BOOLEAN NOT NULL DEFAULT false,
    "isUploadAvatar" BOOLEAN NOT NULL DEFAULT false,
    "verificationTokenEmail" BOOLEAN NOT NULL DEFAULT false,
    "validatorLocation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matchId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user-description" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user-description_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device-info" (
    "id" TEXT NOT NULL,
    "operatingSystem" TEXT NOT NULL,
    "operatingSystemVersion" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceModel" TEXT NOT NULL,
    "screenResolution" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceLanguage" TEXT NOT NULL,
    "networkConnection" TEXT NOT NULL,
    "deviceTemperature" DOUBLE PRECISION NOT NULL,
    "deviceRegion" TEXT NOT NULL,
    "apiLevel" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device-info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarCloudinary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "optimizedSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarCloudinary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code-confirmation-email" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeConfirmation" INTEGER NOT NULL,

    CONSTRAINT "code-confirmation-email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user-location" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user-location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about-me" (
    "id" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "about-me_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMessageCloudinary" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "typeExpirationTimer" TEXT NOT NULL,
    "expirationTimer" TIMESTAMP(3) NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "optimizedSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostMessageCloudinary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complete-data" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "complete-data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "like-post-message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "like-post-message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlike-post-message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "unlike-post-message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mustWatchVideoReword" BOOLEAN NOT NULL DEFAULT false,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "unMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportProblem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "reportProblem" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe-signature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscription" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "country" TEXT,
    "currency" TEXT NOT NULL,
    "currentPeriodStart" INTEGER NOT NULL,
    "currentPeriodEnd" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelAt" INTEGER,
    "description" TEXT NOT NULL,
    "timerInvoice" TEXT NOT NULL,
    "colorTop" TEXT NOT NULL,
    "colorBottom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe-signature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user-description_userId_key" ON "user-description"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "device-info_userId_key" ON "device-info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarCloudinary_userId_key" ON "AvatarCloudinary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "code-confirmation-email_userId_key" ON "code-confirmation-email"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "code-confirmation-email_codeConfirmation_key" ON "code-confirmation-email"("codeConfirmation");

-- CreateIndex
CREATE UNIQUE INDEX "user-location_userId_key" ON "user-location"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "about-me_userId_key" ON "about-me"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "like-post-message_postId_userId_key" ON "like-post-message"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "unlike-post-message_postId_userId_key" ON "unlike-post-message"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "reward_tracking_userId_key" ON "reward_tracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "match_initiatorId_recipientId_key" ON "match"("initiatorId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "stripe-signature_subscription_key" ON "stripe-signature"("subscription");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user-description" ADD CONSTRAINT "user-description_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device-info" ADD CONSTRAINT "device-info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarCloudinary" ADD CONSTRAINT "AvatarCloudinary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code-confirmation-email" ADD CONSTRAINT "code-confirmation-email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user-location" ADD CONSTRAINT "user-location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about-me" ADD CONSTRAINT "about-me_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMessageCloudinary" ADD CONSTRAINT "PostMessageCloudinary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complete-data" ADD CONSTRAINT "complete-data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like-post-message" ADD CONSTRAINT "like-post-message_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostMessageCloudinary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like-post-message" ADD CONSTRAINT "like-post-message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlike-post-message" ADD CONSTRAINT "unlike-post-message_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostMessageCloudinary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlike-post-message" ADD CONSTRAINT "unlike-post-message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_tracking" ADD CONSTRAINT "reward_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportProblem" ADD CONSTRAINT "ReportProblem_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportProblem" ADD CONSTRAINT "ReportProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe-signature" ADD CONSTRAINT "stripe-signature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
