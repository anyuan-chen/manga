import { NextResponse } from 'next/server';
import { decidePanelQuestions } from '@/lib/questionDecision';
import { generatePanelQuestions } from '@/lib/questionGeneration';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ panelId: string }> }
) {
  try {
    // Get session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { panelId } = await params;

    // Step 1: Check if we should generate questions (rule-based filtering)
    const decision = await decidePanelQuestions(panelId, userId);

    if (!decision.shouldAsk) {
      return NextResponse.json({
        shouldAsk: false,
        skipReason: decision.skipReason,
        questions: [],
      });
    }

    // Step 2: Generate questions using LLM
    const questions = await generatePanelQuestions(panelId, userId);

    return NextResponse.json({
      shouldAsk: true,
      questions,
    });
  } catch (error) {
    console.error('Error generating panel questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
