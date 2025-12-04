import { prisma } from './db';

export interface DecisionResult {
  shouldAsk: boolean;
  skipReason?: string;
}

/**
 * Rule-based filtering to decide IF we should ask questions for a panel.
 */
export async function decidePanelQuestions(
  panelId: string,
  userId: string
): Promise<DecisionResult> {
  // Fetch panel data with concepts
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
    include: {
      words: {
        include: {
          word: true,
        },
      },
      grammaticalStructures: {
        include: {
          grammaticalStructure: true,
        },
      },
    },
  });

  if (!panel) {
    return {
      shouldAsk: false,
      skipReason: 'Panel not found',
    };
  }

  // Rule 1: Skip if text is too short
  if (panel.japaneseText.length < 10) {
    return {
      shouldAsk: false,
      skipReason: 'Insufficient text content',
    };
  }

  // Rule 2: Skip if no concepts are tagged
  const totalConcepts = panel.words.length + panel.grammaticalStructures.length;
  if (totalConcepts === 0) {
    return {
      shouldAsk: false,
      skipReason: 'No vocabulary or grammar concepts tagged',
    };
  }

  // Get user performance for all concepts
  const wordPerformance = await Promise.all(
    panel.words.map(async (pw: any) => {
      const attempts = await prisma.wordAttempt.findMany({
        where: {
          userId,
          wordId: pw.word.id,
        },
      });

      const correctCount = attempts.filter(a => a.correct).length;
      return {
        successRate: attempts.length > 0 ? correctCount / attempts.length : 0,
        attemptCount: attempts.length,
      };
    })
  );

  const grammarPerformance = await Promise.all(
    panel.grammaticalStructures.map(async (pgs: any) => {
      const attempts = await prisma.grammaticalStructureAttempt.findMany({
        where: {
          userId,
          grammaticalStructureId: pgs.grammaticalStructure.id,
        },
      });

      const correctCount = attempts.filter(a => a.correct).length;
      return {
        successRate: attempts.length > 0 ? correctCount / attempts.length : 0,
        attemptCount: attempts.length,
      };
    })
  );

  const allPerformance = [...wordPerformance, ...grammarPerformance];

  // Rule 3: Skip if ALL concepts are mastered (100% success with 2+ attempts)
  const allMastered = allPerformance.every(
    p => p.successRate === 1.0 && p.attemptCount >= 2
  );

  if (allMastered) {
    return {
      shouldAsk: false,
      skipReason: 'All concepts mastered (100% success with 2+ attempts)',
    };
  }

  return {
    shouldAsk: true,
  };
}
