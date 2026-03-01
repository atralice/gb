-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('weighted', 'bodyweight', 'timed');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "exerciseType" "ExerciseType" NOT NULL DEFAULT 'weighted';
