/*
  Warnings:

  - You are about to drop the column `mainNotes` on the `WorkoutDay` table. All the data in the column will be lost.
  - You are about to drop the column `warmupNotes` on the `WorkoutDay` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkoutDay" DROP COLUMN "mainNotes",
DROP COLUMN "warmupNotes",
ADD COLUMN     "notes" TEXT;
