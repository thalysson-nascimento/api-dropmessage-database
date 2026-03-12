-- CreateEnum
CREATE TYPE "AISex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AIPersonality" AS ENUM ('SWEET', 'FLIRTY', 'SEDUCTIVE', 'DEEP', 'PLAYFUL', 'INTELLECTUAL', 'MYSTERIOUS');

-- CreateEnum
CREATE TYPE "AIConversationStyle" AS ENUM ('NIGHT_TALKER', 'DEEP_CONVERSATION', 'ROMANTIC', 'FUNNY', 'PHILOSOPHICAL', 'ADVENTUROUS');

-- CreateEnum
CREATE TYPE "AIRelationshipGoal" AS ENUM ('FLIRT', 'FRIENDSHIP', 'ROMANCE', 'CASUAL_CHAT');

-- CreateTable
CREATE TABLE "ai_profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "AISex" NOT NULL,
    "personality" "AIPersonality" NOT NULL,
    "style" "AIConversationStyle" NOT NULL,
    "relationship" "AIRelationshipGoal" NOT NULL,
    "zodiac" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "avatarUrl" TEXT NOT NULL,
    "prompt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_profile_trait" (
    "aiProfileId" TEXT NOT NULL,
    "traitId" TEXT NOT NULL,

    CONSTRAINT "ai_profile_trait_pkey" PRIMARY KEY ("aiProfileId","traitId")
);

-- CreateTable
CREATE TABLE "ai_trait" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ai_trait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_hobby" (
    "aiProfileId" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,

    CONSTRAINT "ai_hobby_pkey" PRIMARY KEY ("aiProfileId","hobbyId")
);

-- CreateTable
CREATE TABLE "ai_interest" (
    "aiProfileId" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,

    CONSTRAINT "ai_interest_pkey" PRIMARY KEY ("aiProfileId","hobbyId")
);

-- CreateTable
CREATE TABLE "ai_lifestyle" (
    "aiProfileId" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,

    CONSTRAINT "ai_lifestyle_pkey" PRIMARY KEY ("aiProfileId","hobbyId")
);

-- CreateTable
CREATE TABLE "ai_conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiProfileId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_trait_key_key" ON "ai_trait"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ai_conversation_userId_aiProfileId_key" ON "ai_conversation"("userId", "aiProfileId");

-- AddForeignKey
ALTER TABLE "ai_profile_trait" ADD CONSTRAINT "ai_profile_trait_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "ai_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_profile_trait" ADD CONSTRAINT "ai_profile_trait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "ai_trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_hobby" ADD CONSTRAINT "ai_hobby_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "ai_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_hobby" ADD CONSTRAINT "ai_hobby_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interest" ADD CONSTRAINT "ai_interest_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "ai_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interest" ADD CONSTRAINT "ai_interest_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_lifestyle" ADD CONSTRAINT "ai_lifestyle_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "ai_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_lifestyle" ADD CONSTRAINT "ai_lifestyle_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "ai_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
