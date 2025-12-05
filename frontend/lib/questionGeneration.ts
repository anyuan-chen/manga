import { prisma } from "./db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { synthesizeUserContext } from "./userContext";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface GeneratedQuestion {
  type: "word" | "grammar" | "reading_comprehension";
  conceptId?: string; // For word/grammar questions
  conceptType?: "word" | "grammar"; // For word/grammar questions
  question: string;
  options: string[];
  correctAnswer: number;
}

/**
 * Generate 2-3 questions for a panel using LLM.
 * LLM decides what types of questions based on panel content and user performance.
 */
export async function generatePanelQuestions(
  panelId: string,
  userId: string
): Promise<GeneratedQuestion[]> {
  // Fetch panel with all related data
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
    throw new Error("Panel not found");
  }

  // Get user performance context
  const userContext = await synthesizeUserContext(userId, panelId);

  // Build concept list for tracking
  const conceptList = buildConceptList(panel);

  const prompt = `You are a Japanese language learning expert creating quiz questions for a manga panel.

PANEL TEXT:
${panel.japaneseText}

${
  userContext
    ? `USER PERFORMANCE:\n${userContext}`
    : "USER PERFORMANCE:\nNo previous attempts."
}

CONCEPTS TAGGED IN THIS PANEL (for tracking):
${conceptList}

INSTRUCTIONS:
Generate 2-3 multiple-choice questions. Choose question types based on the panel and user performance:

1. WORD questions: Test vocabulary meaning, reading, or usage
   - Include conceptId from the list above
   - Reference the panel's context

2. GRAMMAR questions: Test grammatical structure understanding
   - Include conceptId from the list above
   - Test usage in context

3. READING_COMPREHENSION questions: Test overall comprehension
   - Ask about meaning, implication, tone, or context
   - Do NOT include conceptId

STRATEGY:
- Focus on concepts the user struggles with or hasn't practiced
- Mix question types for variety
- Make questions specific to this panel
- Maximum 3 questions

Return as JSON array:
[
  {
    "type": "word" | "grammar" | "reading_comprehension",
    "conceptId": "id from list" (ONLY for word/grammar, OMIT for reading_comprehension),
    "conceptType": "word" | "grammar" (ONLY for word/grammar),
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse LLM response");
    }

    const questions = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
    return questions.slice(0, 3);
  } catch (error) {
    console.error("Failed to generate questions:", error);
    throw new Error("Question generation failed");
  }
}

/**
 * Build simple concept list with IDs and names for tracking
 */
function buildConceptList(panel: any): string {
  const lines: string[] = [];

  // Words
  for (const pw of panel.words) {
    const word = pw.word;
    lines.push(`- [WORD] ${word.japanese} (ID: ${word.id})`);
  }

  // Grammar
  for (const pgs of panel.grammaticalStructures) {
    const grammar = pgs.grammaticalStructure;
    lines.push(`- [GRAMMAR] ${grammar.name} (ID: ${grammar.id})`);
  }

  return lines.length > 0 ? lines.join("\n") : "No concepts tagged";
}
