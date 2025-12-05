import { prisma } from './db';

export interface ChapterStats {
  predictedJlptLevel: number | null;
  uniqueWordsCount: number;
  uniqueGrammarCount: number;
  panelCount: number;
  totalCharacters: number;
  avgJlptWords: number | null;
  avgJlptGrammar: number | null;
}

/**
 * Calculate comprehensive statistics for a chapter based on its panels,
 * words, and grammatical structures.
 */
export async function calculateChapterStats(chapterId: string): Promise<ChapterStats> {
  // Get all panels for this chapter with their words and grammar
  const panels = await prisma.panel.findMany({
    where: { chapterId },
    include: {
      words: {
        include: {
          word: {
            select: {
              id: true,
              japanese: true,
              jlptLevel: true,
            },
          },
        },
      },
      grammaticalStructures: {
        include: {
          grammaticalStructure: {
            select: {
              id: true,
              name: true,
              jlptLevel: true,
            },
          },
        },
      },
    },
  });

  // Calculate panel count
  const panelCount = panels.length;

  // Calculate total characters
  const totalCharacters = panels.reduce((sum, panel) => {
    return sum + (panel.japaneseText?.length || 0);
  }, 0);

  // Collect unique words and their JLPT levels
  const uniqueWords = new Map<string, number | null>();
  panels.forEach(panel => {
    panel.words.forEach(pw => {
      if (!uniqueWords.has(pw.word.id)) {
        uniqueWords.set(pw.word.id, pw.word.jlptLevel);
      }
    });
  });

  // Collect unique grammatical structures and their JLPT levels
  const uniqueGrammar = new Map<string, number | null>();
  panels.forEach(panel => {
    panel.grammaticalStructures.forEach(pgs => {
      if (!uniqueGrammar.has(pgs.grammaticalStructure.id)) {
        uniqueGrammar.set(pgs.grammaticalStructure.id, pgs.grammaticalStructure.jlptLevel);
      }
    });
  });

  const uniqueWordsCount = uniqueWords.size;
  const uniqueGrammarCount = uniqueGrammar.size;

  // Calculate average JLPT level for words
  const wordJlptLevels = Array.from(uniqueWords.values()).filter((level): level is number => level !== null);
  const avgJlptWords = wordJlptLevels.length > 0
    ? wordJlptLevels.reduce((sum, level) => sum + level, 0) / wordJlptLevels.length
    : null;

  // Calculate average JLPT level for grammar
  const grammarJlptLevels = Array.from(uniqueGrammar.values()).filter((level): level is number => level !== null);
  const avgJlptGrammar = grammarJlptLevels.length > 0
    ? grammarJlptLevels.reduce((sum, level) => sum + level, 0) / grammarJlptLevels.length
    : null;

  // Calculate predicted JLPT level (weighted average of words and grammar)
  // Give more weight to words (60%) than grammar (40%) as words are more numerous
  let predictedJlptLevel: number | null = null;
  if (avgJlptWords !== null && avgJlptGrammar !== null) {
    predictedJlptLevel = (avgJlptWords * 0.6 + avgJlptGrammar * 0.4);
  } else if (avgJlptWords !== null) {
    predictedJlptLevel = avgJlptWords;
  } else if (avgJlptGrammar !== null) {
    predictedJlptLevel = avgJlptGrammar;
  }

  return {
    predictedJlptLevel,
    uniqueWordsCount,
    uniqueGrammarCount,
    panelCount,
    totalCharacters,
    avgJlptWords,
    avgJlptGrammar,
  };
}

/**
 * Update a chapter's statistics in the database
 */
export async function updateChapterStats(chapterId: string): Promise<ChapterStats> {
  const stats = await calculateChapterStats(chapterId);

  await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      predictedJlptLevel: stats.predictedJlptLevel,
      uniqueWordsCount: stats.uniqueWordsCount,
      uniqueGrammarCount: stats.uniqueGrammarCount,
      panelCount: stats.panelCount,
      totalCharacters: stats.totalCharacters,
      avgJlptWords: stats.avgJlptWords,
      avgJlptGrammar: stats.avgJlptGrammar,
    },
  });

  return stats;
}

/**
 * Update statistics for all chapters
 */
export async function updateAllChapterStats(): Promise<void> {
  const chapters = await prisma.chapter.findMany({
    select: { id: true, title: true },
  });

  console.log(`Updating stats for ${chapters.length} chapters...`);

  for (const chapter of chapters) {
    try {
      const stats = await updateChapterStats(chapter.id);
      console.log(`✓ ${chapter.title}:`, {
        panels: stats.panelCount,
        words: stats.uniqueWordsCount,
        grammar: stats.uniqueGrammarCount,
        jlpt: stats.predictedJlptLevel?.toFixed(1),
      });
    } catch (error) {
      console.error(`✗ Error updating ${chapter.title}:`, error);
    }
  }

  console.log('Done!');
}
