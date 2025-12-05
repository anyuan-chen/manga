import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function GET(request: Request) {
  try {
    // Get session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch last 10 incorrect word attempts
    const wordAttempts = await prisma.wordAttempt.findMany({
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
      take: 10,
    });

    // Fetch last 10 incorrect grammatical structure attempts
    const grammarAttempts = await prisma.grammaticalStructureAttempt.findMany({
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
      take: 10,
    });

    // Combine and sort by creation date, take top 10
    const allAttempts = [
      ...wordAttempts.map(a => ({ type: 'word' as const, attempt: a })),
      ...grammarAttempts.map(a => ({ type: 'grammar' as const, attempt: a })),
    ]
      .sort((a, b) => b.attempt.createdAt.getTime() - a.attempt.createdAt.getTime())
      .slice(0, 10);

    // Generate questions for each mistake
    const reviewItems = await Promise.all(
      allAttempts.map(async ({ type, attempt }) => {
        let question = '';
        let topicInfo: any = {};

        if (type === 'word') {
          const wordAttempt = attempt as any;
          const word = wordAttempt.word;

          topicInfo = {
            japanese: word.japanese,
            reading: word.reading,
            meaning: word.meaning,
            partOfSpeech: word.partOfSpeech,
            jlptLevel: word.jlptLevel,
          };

          // Generate question with Gemini
          const prompt = `Generate a multiple-choice question to test the Japanese word "${word.japanese}" (${word.reading}), which means "${word.meaning}".
The question should help the learner practice this word in context.
Format your response as JSON with the following structure:
{
  "question": "the question text in English",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0 (index of the correct option, 0-3)
}`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          // Parse JSON from response (handle markdown code blocks if present)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const questionData = JSON.parse(jsonMatch[0]);
            question = questionData.question;
            topicInfo.options = questionData.options;
            topicInfo.correctAnswer = questionData.correctAnswer;
          }
        } else {
          const grammarAttempt = attempt as any;
          const grammar = grammarAttempt.grammaticalStructure;

          topicInfo = {
            name: grammar.name,
            pattern: grammar.pattern,
            explanation: grammar.explanation,
            jlptLevel: grammar.jlptLevel,
          };

          // Generate question with Gemini
          const prompt = `Generate a multiple-choice question to test the Japanese grammatical structure "${grammar.name}" (pattern: ${grammar.pattern}).
Explanation: ${grammar.explanation}
The question should help the learner practice this grammar point in context.
Format your response as JSON with the following structure:
{
  "question": "the question text in English",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0 (index of the correct option, 0-3)
}`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          // Parse JSON from response (handle markdown code blocks if present)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const questionData = JSON.parse(jsonMatch[0]);
            question = questionData.question;
            topicInfo.options = questionData.options;
            topicInfo.correctAnswer = questionData.correctAnswer;
          }
        }

        return {
          type,
          topicInfo,
          attemptId: attempt.id,
          createdAt: attempt.createdAt,
        };
      })
    );

    return NextResponse.json({ reviewItems });
  } catch (error) {
    console.error('Error generating review questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate review questions' },
      { status: 500 }
    );
  }
}
