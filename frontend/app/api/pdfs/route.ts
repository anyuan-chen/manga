import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        filePath: true,
        orderIndex: true,
        predictedJlptLevel: true,
        uniqueWordsCount: true,
        uniqueGrammarCount: true,
        panelCount: true,
        totalCharacters: true,
        avgJlptWords: true,
        avgJlptGrammar: true,
      },
    });

    // Map to the expected format with path for backward compatibility
    const pdfs = chapters.map(chapter => ({
      id: chapter.id,
      name: chapter.title,
      description: chapter.description,
      path: chapter.filePath ? `/data/chapters/${chapter.filePath}` : null,
      orderIndex: chapter.orderIndex,
      stats: {
        predictedJlptLevel: chapter.predictedJlptLevel,
        uniqueWordsCount: chapter.uniqueWordsCount,
        uniqueGrammarCount: chapter.uniqueGrammarCount,
        panelCount: chapter.panelCount,
        totalCharacters: chapter.totalCharacters,
        avgJlptWords: chapter.avgJlptWords,
        avgJlptGrammar: chapter.avgJlptGrammar,
      },
    }));

    return NextResponse.json({ pdfs });
  } catch (error) {
    console.error('Error fetching chapters from database:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}
