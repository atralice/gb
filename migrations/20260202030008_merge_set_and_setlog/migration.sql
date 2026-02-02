/*
  Warnings:

  - You are about to drop the `SetLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SetLog" DROP CONSTRAINT "SetLog_setId_fkey";

-- AlterTable
ALTER TABLE "Set" ADD COLUMN     "actualDurationSeconds" INTEGER,
ADD COLUMN     "actualReps" INTEGER,
ADD COLUMN     "actualRpe" INTEGER,
ADD COLUMN     "actualWeightKg" DOUBLE PRECISION,
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "logNotes" TEXT,
ADD COLUMN     "skipped" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "SetLog";
