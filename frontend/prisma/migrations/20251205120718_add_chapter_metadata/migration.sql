-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "avgJlptGrammar" DOUBLE PRECISION,
ADD COLUMN     "avgJlptWords" DOUBLE PRECISION,
ADD COLUMN     "panelCount" INTEGER,
ADD COLUMN     "predictedJlptLevel" DOUBLE PRECISION,
ADD COLUMN     "totalCharacters" INTEGER,
ADD COLUMN     "uniqueGrammarCount" INTEGER,
ADD COLUMN     "uniqueWordsCount" INTEGER;
