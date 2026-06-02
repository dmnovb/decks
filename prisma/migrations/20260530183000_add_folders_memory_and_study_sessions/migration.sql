-- Add folder organization, user memory, and study-session tracking.
-- The guards make this migration safe for databases that received these
-- objects before this migration file was committed.

ALTER TABLE "public"."Deck"
ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "public"."Deck"
ADD COLUMN IF NOT EXISTS "folderId" TEXT;

CREATE TABLE IF NOT EXISTS "public"."Folder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."UserMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMemory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalCards" INTEGER NOT NULL,
    "newCards" INTEGER NOT NULL DEFAULT 0,
    "reviewCards" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "averageTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."CardReview" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserMemory_userId_key" ON "public"."UserMemory"("userId");
CREATE INDEX IF NOT EXISTS "Folder_userId_idx" ON "public"."Folder"("userId");
CREATE INDEX IF NOT EXISTS "Folder_parentId_idx" ON "public"."Folder"("parentId");
CREATE INDEX IF NOT EXISTS "Deck_folderId_idx" ON "public"."Deck"("folderId");
CREATE INDEX IF NOT EXISTS "StudySession_userId_startedAt_idx" ON "public"."StudySession"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "StudySession_deckId_idx" ON "public"."StudySession"("deckId");
CREATE INDEX IF NOT EXISTS "CardReview_sessionId_idx" ON "public"."CardReview"("sessionId");
CREATE INDEX IF NOT EXISTS "CardReview_flashcardId_idx" ON "public"."CardReview"("flashcardId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'Folder_userId_fkey'
    ) THEN
        ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'Folder_parentId_fkey'
    ) THEN
        ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "public"."Folder"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'Deck_folderId_fkey'
    ) THEN
        ALTER TABLE "public"."Deck" ADD CONSTRAINT "Deck_folderId_fkey"
        FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'UserMemory_userId_fkey'
    ) THEN
        ALTER TABLE "public"."UserMemory" ADD CONSTRAINT "UserMemory_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'StudySession_userId_fkey'
    ) THEN
        ALTER TABLE "public"."StudySession" ADD CONSTRAINT "StudySession_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'StudySession_deckId_fkey'
    ) THEN
        ALTER TABLE "public"."StudySession" ADD CONSTRAINT "StudySession_deckId_fkey"
        FOREIGN KEY ("deckId") REFERENCES "public"."Deck"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'CardReview_sessionId_fkey'
    ) THEN
        ALTER TABLE "public"."CardReview" ADD CONSTRAINT "CardReview_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "public"."StudySession"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'CardReview_flashcardId_fkey'
    ) THEN
        ALTER TABLE "public"."CardReview" ADD CONSTRAINT "CardReview_flashcardId_fkey"
        FOREIGN KEY ("flashcardId") REFERENCES "public"."Flashcard"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
