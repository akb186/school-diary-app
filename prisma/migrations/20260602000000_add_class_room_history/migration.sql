-- AlterTable
ALTER TABLE "Diary" ADD COLUMN "classRoomId" INTEGER;

-- Backfill existing diaries with the student's current class at the time of migration.
UPDATE "Diary"
SET "classRoomId" = "User"."classRoomId"
FROM "User"
WHERE "Diary"."studentId" = "User"."id";

-- CreateTable
CREATE TABLE "ClassRoomHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "classRoomId" INTEGER NOT NULL,
    "schoolYear" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassRoomHistory_pkey" PRIMARY KEY ("id")
);

-- Backfill current class assignments as open histories.
INSERT INTO "ClassRoomHistory" ("userId", "classRoomId", "schoolYear", "startedAt")
SELECT
    "id",
    "classRoomId",
    CASE
        WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 4
            THEN EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        ELSE EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - 1
    END,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "classRoomId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "ClassRoomHistory_userId_idx" ON "ClassRoomHistory"("userId");

-- CreateIndex
CREATE INDEX "ClassRoomHistory_classRoomId_idx" ON "ClassRoomHistory"("classRoomId");

-- CreateIndex
CREATE INDEX "ClassRoomHistory_schoolYear_idx" ON "ClassRoomHistory"("schoolYear");

-- AddForeignKey
ALTER TABLE "Diary" ADD CONSTRAINT "Diary_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRoomHistory" ADD CONSTRAINT "ClassRoomHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRoomHistory" ADD CONSTRAINT "ClassRoomHistory_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
