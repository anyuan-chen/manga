import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check for incorrect word attempts
    const incorrectWords = await prisma.wordAttempt.findMany({
      where: {
        userId,
        correct: false,
      },
      include: {
        word: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3, // Get up to 3 examples
      distinct: ['wordId'], // Only get unique words
    });

    // Check for incorrect grammatical structure attempts
    const incorrectGrammar = await prisma.grammaticalStructureAttempt.findMany({
      where: {
        userId,
        correct: false,
      },
      include: {
        grammaticalStructure: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3, // Get up to 3 examples
      distinct: ['grammaticalStructureId'], // Only get unique grammar patterns
    });

    const hasMistakes = incorrectWords.length > 0 || incorrectGrammar.length > 0;

    if (!hasMistakes) {
      return NextResponse.json({ hasMistakes: false });
    }

    // Format examples for display
    const wordExamples = incorrectWords.map(attempt => ({
      japanese: attempt.word.japanese,
      reading: attempt.word.reading,
      meaning: attempt.word.meaning,
    }));

    const grammarExamples = incorrectGrammar.map(attempt => ({
      name: attempt.grammaticalStructure.name,
      pattern: attempt.grammaticalStructure.pattern,
    }));

    return NextResponse.json({
      hasMistakes: true,
      totalCount: incorrectWords.length + incorrectGrammar.length,
      examples: {
        words: wordExamples,
        grammar: grammarExamples,
      },
    });
  } catch (error) {
    console.error('Error checking review status:', error);
    return NextResponse.json(
      { error: 'Failed to check review status' },
      { status: 500 }
    );
  }
}
