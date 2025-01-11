/*
  Warnings:

  - You are about to drop the `ChatReportProblem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatReportProblem" DROP CONSTRAINT "ChatReportProblem_matchId_fkey";

-- DropForeignKey
ALTER TABLE "ChatReportProblem" DROP CONSTRAINT "ChatReportProblem_userId_fkey";

-- DropTable
DROP TABLE "ChatReportProblem";

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

-- AddForeignKey
ALTER TABLE "ReportProblem" ADD CONSTRAINT "ReportProblem_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportProblem" ADD CONSTRAINT "ReportProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
