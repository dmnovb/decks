-- Persist the set of flashcards selected for a study session so review
-- submissions can be validated against the original session membership.
CREATE TABLE "StudySessionCard" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySessionCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudySessionCard_sessionId_flashcardId_key" ON "StudySessionCard"("sessionId", "flashcardId");
CREATE INDEX "StudySessionCard_flashcardId_idx" ON "StudySessionCard"("flashcardId");

ALTER TABLE "StudySessionCard"
ADD CONSTRAINT "StudySessionCard_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudySessionCard"
ADD CONSTRAINT "StudySessionCard_flashcardId_fkey"
FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
