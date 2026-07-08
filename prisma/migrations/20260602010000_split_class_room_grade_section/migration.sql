-- AlterTable
ALTER TABLE "ClassRoom" ADD COLUMN "grade" INTEGER;
ALTER TABLE "ClassRoom" ADD COLUMN "section" TEXT;

-- Backfill grade and section from the existing display name such as "1-A".
UPDATE "ClassRoom"
SET
    "grade" = CASE
        WHEN "name" ~ '^[0-9]+-.+'
            THEN split_part("name", '-', 1)::INTEGER
        ELSE 0
    END,
    "section" = CASE
        WHEN "name" ~ '^[0-9]+-.+'
            THEN split_part("name", '-', 2)
        ELSE "name"
    END;

ALTER TABLE "ClassRoom" ALTER COLUMN "grade" SET NOT NULL;
ALTER TABLE "ClassRoom" ALTER COLUMN "section" SET NOT NULL;

-- Keep display names normalized after the split.
UPDATE "ClassRoom"
SET "name" = "grade"::TEXT || '-' || "section";

-- CreateIndex
CREATE UNIQUE INDEX "ClassRoom_grade_section_key" ON "ClassRoom"("grade", "section");
