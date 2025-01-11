-- CreateTable
CREATE TABLE "ChatReportProblem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "reportProblem" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatReportProblem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatReportProblem" ADD CONSTRAINT "ChatReportProblem_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatReportProblem" ADD CONSTRAINT "ChatReportProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
