import { prisma } from './db';

export interface WordPerformance {
  wordId: string;
  japanese: string;
  meaning: string;
  successRate: number;
  attemptCount: number;
}

export interface GrammarPerformance {
  grammarId: string;
  name: string;
  pattern: string;
  successRate: number;
  attemptCount: number;
}

export interface UserPerformanceData {
  words: WordPerformance[];
  grammar: GrammarPerformance[];
}

// In-memory cache with 5-minute TTL
interface CacheEntry {
  data: UserPerformanceData;
  timestamp: number;
}

const performanceCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get structured user performance data for a panel's concepts.
 * Results are cached for 5 minutes to optimize repeated calls.
 */
export async function getUserPerformanceData(
  userId: string,
  panelId: string
): Promise<UserPerformanceData> {
  const cacheKey = `${userId}:${panelId}`;

  // Check cache
  const cached = performanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Query word performance with aggregation
  const wordStats = await prisma.$queryRaw<Array<{
    id: string;
    japanese: string;
    meaning: string;
    total_attempts: bigint;
    correct_attempts: bigint;
  }>>`
    SELECT
      w.id,
      w.japanese,
      w.meaning,
      COUNT(wa.id)::int as total_attempts,
      SUM(CASE WHEN wa.correct THEN 1 ELSE 0 END)::int as correct_attempts
    FROM "PanelWord" pw
    JOIN "Word" w ON w.id = pw."wordId"
    LEFT JOIN "WordAttempt" wa ON wa."wordId" = w.id AND wa."userId" = ${userId}
    WHERE pw."panelId" = ${panelId}
    GROUP BY w.id, w.japanese, w.meaning
    HAVING COUNT(wa.id) > 0
    ORDER BY (SUM(CASE WHEN wa.correct THEN 1 ELSE 0 END)::float / COUNT(wa.id)::float) ASC
  `;

  // Query grammar performance with aggregation
  const grammarStats = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    pattern: string;
    total_attempts: bigint;
    correct_attempts: bigint;
  }>>`
    SELECT
      gs.id,
      gs.name,
      gs.pattern,
      COUNT(gsa.id)::int as total_attempts,
      SUM(CASE WHEN gsa.correct THEN 1 ELSE 0 END)::int as correct_attempts
    FROM "PanelGrammaticalStructure" pgs
    JOIN "GrammaticalStructure" gs ON gs.id = pgs."grammaticalStructureId"
    LEFT JOIN "GrammaticalStructureAttempt" gsa ON gsa."grammaticalStructureId" = gs.id AND gsa."userId" = ${userId}
    WHERE pgs."panelId" = ${panelId}
    GROUP BY gs.id, gs.name, gs.pattern
    HAVING COUNT(gsa.id) > 0
    ORDER BY (SUM(CASE WHEN gsa.correct THEN 1 ELSE 0 END)::float / COUNT(gsa.id)::float) ASC
  `;

  // Transform to structured data
  const data: UserPerformanceData = {
    words: wordStats.map(stat => ({
      wordId: stat.id,
      japanese: stat.japanese,
      meaning: stat.meaning,
      successRate: Number(stat.correct_attempts) / Number(stat.total_attempts),
      attemptCount: Number(stat.total_attempts),
    })),
    grammar: grammarStats.map(stat => ({
      grammarId: stat.id,
      name: stat.name,
      pattern: stat.pattern,
      successRate: Number(stat.correct_attempts) / Number(stat.total_attempts),
      attemptCount: Number(stat.total_attempts),
    })),
  };

  // Cache the result
  performanceCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  return data;
}

/**
 * Synthesizes a natural language description of user's performance
 * on vocabulary and grammar concepts present in a specific panel.
 *
 * Returns empty string if user has no attempt history for the panel's concepts.
 */
export async function synthesizeUserContext(
  userId: string,
  panelId: string
): Promise<string> {
  const performanceData = await getUserPerformanceData(userId, panelId);

  // Return empty if no data
  if (performanceData.words.length === 0 && performanceData.grammar.length === 0) {
    return '';
  }

  // Single pass categorization
  const strong: string[] = [];
  const weak: string[] = [];
  const moderate: string[] = [];

  for (const word of performanceData.words) {
    const name = `${word.japanese} (${word.meaning})`;
    const detail = `${name} (${Math.round(word.successRate * 100)}%)`;

    if (word.successRate === 1.0) strong.push(name);
    else if (word.successRate < 0.5) weak.push(detail);
    else moderate.push(detail);
  }

  for (const grammar of performanceData.grammar) {
    const name = `${grammar.name} (${grammar.pattern})`;
    const detail = `${name} (${Math.round(grammar.successRate * 100)}%)`;

    if (grammar.successRate === 1.0) strong.push(name);
    else if (grammar.successRate < 0.5) weak.push(detail);
    else moderate.push(detail);
  }

  // Build context string
  const parts: string[] = [];

  if (strong.length > 0) {
    parts.push(`The user has mastered: ${strong.join(', ')}.`);
  }

  if (weak.length > 0) {
    parts.push(`The user struggles with: ${weak.join(', ')}.`);
  }

  if (moderate.length > 0) {
    parts.push(`The user has partial knowledge of: ${moderate.join(', ')}.`);
  }

  return parts.join(' ');
}
