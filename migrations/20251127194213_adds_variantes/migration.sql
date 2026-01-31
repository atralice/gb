/*
  Warnings:

  - You are about to drop the column `variants` on the `Exercise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "variants";

-- AlterTable
ALTER TABLE "WorkoutDayExercise" ADD COLUMN     "variants" TEXT[] DEFAULT ARRAY[]::TEXT[];
