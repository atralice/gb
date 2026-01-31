-- CreateTable
CREATE TABLE "WorkoutDayBlockComment" (
    "id" TEXT NOT NULL,
    "workoutDayId" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutDayBlockComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutDayBlockComment_workoutDayId_block_key" ON "WorkoutDayBlockComment"("workoutDayId", "block");

-- AddForeignKey
ALTER TABLE "WorkoutDayBlockComment" ADD CONSTRAINT "WorkoutDayBlockComment_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "WorkoutDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
