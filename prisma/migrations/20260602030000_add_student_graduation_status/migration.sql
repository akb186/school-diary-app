-- AlterTable
ALTER TABLE "User" ADD COLUMN "studentStatus" TEXT;
ALTER TABLE "User" ADD COLUMN "graduatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "graduatedSchoolYear" INTEGER;

-- Existing students with a class are active. Existing students without a class are treated as unassigned, not graduated.
UPDATE "User"
SET "studentStatus" = 'ACTIVE'
WHERE "role" = 'STUDENT';
