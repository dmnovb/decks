/*
  Warnings:

  - You are about to alter the column `difficulty` on the `Flashcard` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Flashcard" ALTER COLUMN "difficulty" SET DEFAULT 0,
ALTER COLUMN "difficulty" SET DATA TYPE INTEGER;
