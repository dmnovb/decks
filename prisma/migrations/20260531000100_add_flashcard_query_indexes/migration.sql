-- CreateIndex
CREATE INDEX "Flashcard_deckId_idx" ON "public"."Flashcard"("deckId");

-- CreateIndex
CREATE INDEX "Flashcard_nextReview_idx" ON "public"."Flashcard"("nextReview");

-- CreateIndex
CREATE INDEX "Flashcard_lastReviewed_idx" ON "public"."Flashcard"("lastReviewed");
