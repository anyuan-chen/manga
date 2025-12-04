import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      questionType,
      conceptId,
      conceptType,
      selectedAnswer,
      correctAnswer,
      timeSpent,
    } = body;

    if (!userId || !questionType) {
      return NextResponse.json(
        { error: 'userId and questionType are required' },
        { status: 400 }
      );
    }

    const correct = selectedAnswer === correctAnswer;

    // For word and grammar questions, record attempt in existing tables
    if (questionType === 'word' && conceptId && conceptType === 'word') {
      await prisma.wordAttempt.create({
        data: {
          userId,
          wordId: conceptId,
          correct,
        },
      });
    } else if (questionType === 'grammar' && conceptId && conceptType === 'grammar') {
      await prisma.grammaticalStructureAttempt.create({
        data: {
          userId,
          grammaticalStructureId: conceptId,
          correct,
        },
      });
    }
    // For reading comprehension, we don't track attempts (no concept to link to)

    return NextResponse.json({
      success: true,
      correct,
    });
  } catch (error) {
    console.error('Error recording answer:', error);
    return NextResponse.json(
      { error: 'Failed to record answer' },
      { status: 500 }
    );
  }
}
