-- DropIndex
DROP INDEX "ClassRoom_grade_section_key";

-- AlterTable
ALTER TABLE "ClassRoom" RENAME COLUMN "section" TO "class";

-- Keep display names normalized after the rename.
UPDATE "ClassRoom"
SET "name" = "grade"::TEXT || '-' || "class";

-- CreateIndex
CREATE UNIQUE INDEX "ClassRoom_grade_class_key" ON "ClassRoom"("grade", "class");
