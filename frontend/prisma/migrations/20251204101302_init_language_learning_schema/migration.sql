-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panel" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "japaneseText" TEXT NOT NULL,
    "translation" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "japanese" TEXT NOT NULL,
    "reading" TEXT,
    "meaning" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "jlptLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammaticalStructure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "jlptLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammaticalStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelWord" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,

    CONSTRAINT "PanelWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelGrammaticalStructure" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "grammaticalStructureId" TEXT NOT NULL,

    CONSTRAINT "PanelGrammaticalStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammaticalStructureAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grammaticalStructureId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammaticalStructureAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_orderIndex_key" ON "Chapter"("orderIndex");

-- CreateIndex
CREATE INDEX "Panel_chapterId_idx" ON "Panel"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Panel_chapterId_orderIndex_key" ON "Panel"("chapterId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Word_japanese_key" ON "Word"("japanese");

-- CreateIndex
CREATE INDEX "Word_jlptLevel_idx" ON "Word"("jlptLevel");

-- CreateIndex
CREATE UNIQUE INDEX "GrammaticalStructure_name_key" ON "GrammaticalStructure"("name");

-- CreateIndex
CREATE INDEX "GrammaticalStructure_jlptLevel_idx" ON "GrammaticalStructure"("jlptLevel");

-- CreateIndex
CREATE INDEX "PanelWord_wordId_idx" ON "PanelWord"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "PanelWord_panelId_wordId_key" ON "PanelWord"("panelId", "wordId");

-- CreateIndex
CREATE INDEX "PanelGrammaticalStructure_grammaticalStructureId_idx" ON "PanelGrammaticalStructure"("grammaticalStructureId");

-- CreateIndex
CREATE UNIQUE INDEX "PanelGrammaticalStructure_panelId_grammaticalStructureId_key" ON "PanelGrammaticalStructure"("panelId", "grammaticalStructureId");

-- CreateIndex
CREATE INDEX "WordAttempt_userId_wordId_idx" ON "WordAttempt"("userId", "wordId");

-- CreateIndex
CREATE INDEX "WordAttempt_wordId_idx" ON "WordAttempt"("wordId");

-- CreateIndex
CREATE INDEX "WordAttempt_createdAt_idx" ON "WordAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "GrammaticalStructureAttempt_userId_grammaticalStructureId_idx" ON "GrammaticalStructureAttempt"("userId", "grammaticalStructureId");

-- CreateIndex
CREATE INDEX "GrammaticalStructureAttempt_grammaticalStructureId_idx" ON "GrammaticalStructureAttempt"("grammaticalStructureId");

-- CreateIndex
CREATE INDEX "GrammaticalStructureAttempt_createdAt_idx" ON "GrammaticalStructureAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "Panel" ADD CONSTRAINT "Panel_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelWord" ADD CONSTRAINT "PanelWord_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelWord" ADD CONSTRAINT "PanelWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelGrammaticalStructure" ADD CONSTRAINT "PanelGrammaticalStructure_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelGrammaticalStructure" ADD CONSTRAINT "PanelGrammaticalStructure_grammaticalStructureId_fkey" FOREIGN KEY ("grammaticalStructureId") REFERENCES "GrammaticalStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordAttempt" ADD CONSTRAINT "WordAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordAttempt" ADD CONSTRAINT "WordAttempt_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammaticalStructureAttempt" ADD CONSTRAINT "GrammaticalStructureAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammaticalStructureAttempt" ADD CONSTRAINT "GrammaticalStructureAttempt_grammaticalStructureId_fkey" FOREIGN KEY ("grammaticalStructureId") REFERENCES "GrammaticalStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
