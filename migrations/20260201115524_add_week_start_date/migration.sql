-- AlterTable: Add weekStartDate column with a default value for existing rows
-- First add column as nullable
ALTER TABLE "WorkoutDay" ADD COLUMN "weekStartDate" TIMESTAMP(3);

-- Set weekStartDate for existing rows based on weekNumber
-- Using a base date (Monday 2025-01-06) and adding (weekNumber - 1) * 7 days
UPDATE "WorkoutDay" SET "weekStartDate" = DATE '2025-01-06' + ("weekNumber" - 1) * INTERVAL '7 days' WHERE "weekStartDate" IS NULL;

-- Make column required
ALTER TABLE "WorkoutDay" ALTER COLUMN "weekStartDate" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutDay_athleteId_weekStartDate_dayIndex_key" ON "WorkoutDay"("athleteId", "weekStartDate", "dayIndex");
