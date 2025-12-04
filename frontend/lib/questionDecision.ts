import { prisma } from './db';
import { getUserPerformanceData } from './userContext';

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

  // Get user performance for all concepts (cached)
  const performanceData = await getUserPerformanceData(userId, panelId);

  // Combine all performance data
  const allPerformance = [
    ...performanceData.words.map(w => ({
      successRate: w.successRate,
      attemptCount: w.attemptCount,
    })),
    ...performanceData.grammar.map(g => ({
      successRate: g.successRate,
      attemptCount: g.attemptCount,
    })),
  ];

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
