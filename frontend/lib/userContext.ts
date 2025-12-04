import { prisma } from './db';

interface ConceptPerformance {
  name: string;
  successRate: number;
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
  // Query word performance with aggregation
  const wordStats = await prisma.$queryRaw<Array<{
    japanese: string;
    meaning: string;
    total_attempts: bigint;
    correct_attempts: bigint;
  }>>`
    SELECT
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
    name: string;
    pattern: string;
    total_attempts: bigint;
    correct_attempts: bigint;
  }>>`
    SELECT
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

  // Return empty if no data
  if (wordStats.length === 0 && grammarStats.length === 0) {
    return '';
  }

  // Single pass categorization
  const strong: string[] = [];
  const weak: string[] = [];
  const moderate: string[] = [];

  for (const stat of wordStats) {
    const successRate = Number(stat.correct_attempts) / Number(stat.total_attempts);
    const name = `${stat.japanese} (${stat.meaning})`;
    const detail = `${name} (${Math.round(successRate * 100)}%)`;

    if (successRate === 1.0) strong.push(name);
    else if (successRate < 0.5) weak.push(detail);
    else moderate.push(detail);
  }

  for (const stat of grammarStats) {
    const successRate = Number(stat.correct_attempts) / Number(stat.total_attempts);
    const name = `${stat.name} (${stat.pattern})`;
    const detail = `${name} (${Math.round(successRate * 100)}%)`;

    if (successRate === 1.0) strong.push(name);
    else if (successRate < 0.5) weak.push(detail);
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
