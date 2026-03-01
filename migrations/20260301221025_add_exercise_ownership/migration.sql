/*
  Warnings:

  - A unique constraint covering the columns `[name,ownerId]` on the table `Exercise` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Exercise_name_key";

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "globalSourceId" TEXT,
ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_ownerId_key" ON "Exercise"("name", "ownerId");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_globalSourceId_fkey" FOREIGN KEY ("globalSourceId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
