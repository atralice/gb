/*
  Warnings:

  - You are about to drop the column `hasWeight` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Set` table. All the data in the column will be lost.
  - You are about to drop the column `rpe` on the `Set` table. All the data in the column will be lost.
  - You are about to drop the column `workoutDayExerciseId` on the `Set` table. All the data in the column will be lost.
  - You are about to drop the `WorkoutDayBlockComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkoutDayExercise` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Exercise` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workoutBlockExerciseId,setIndex]` on the table `Set` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workoutBlockExerciseId` to the `Set` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Set" DROP CONSTRAINT "Set_workoutDayExerciseId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutDayBlockComment" DROP CONSTRAINT "WorkoutDayBlockComment_workoutDayId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutDayExercise" DROP CONSTRAINT "WorkoutDayExercise_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutDayExercise" DROP CONSTRAINT "WorkoutDayExercise_workoutDayId_fkey";

-- DropIndex
DROP INDEX "Set_workoutDayExerciseId_setIndex_key";

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "hasWeight";

-- AlterTable
ALTER TABLE "Set" DROP COLUMN "notes",
DROP COLUMN "rpe",
DROP COLUMN "workoutDayExerciseId",
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "workoutBlockExerciseId" TEXT NOT NULL;

-- DropTable
DROP TABLE "WorkoutDayBlockComment";

-- DropTable
DROP TABLE "WorkoutDayExercise";

-- CreateTable
CREATE TABLE "WorkoutBlock" (
    "id" TEXT NOT NULL,
    "workoutDayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutBlockExercise" (
    "id" TEXT NOT NULL,
    "workoutBlockId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "comment" TEXT,
    "variants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutBlockExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetLog" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "actualReps" INTEGER,
    "actualWeightKg" DOUBLE PRECISION,
    "actualDurationSeconds" INTEGER,
    "actualRpe" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutBlock_workoutDayId_order_key" ON "WorkoutBlock"("workoutDayId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutBlockExercise_workoutBlockId_order_key" ON "WorkoutBlockExercise"("workoutBlockId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SetLog_setId_key" ON "SetLog"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Set_workoutBlockExerciseId_setIndex_key" ON "Set"("workoutBlockExerciseId", "setIndex");

-- AddForeignKey
ALTER TABLE "WorkoutBlock" ADD CONSTRAINT "WorkoutBlock_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "WorkoutDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutBlockExercise" ADD CONSTRAINT "WorkoutBlockExercise_workoutBlockId_fkey" FOREIGN KEY ("workoutBlockId") REFERENCES "WorkoutBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutBlockExercise" ADD CONSTRAINT "WorkoutBlockExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_workoutBlockExerciseId_fkey" FOREIGN KEY ("workoutBlockExerciseId") REFERENCES "WorkoutBlockExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set"("id") ON DELETE CASCADE ON UPDATE CASCADE;
