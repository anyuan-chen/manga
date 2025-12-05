/**
 * Very small helper that:
 *   - splits a chapter PDF into one-PDF-per-page (in memory)
 *   - sends each single-page PDF to Gemini (one call per page)
 *   - writes a single JSON file with all page results
 */

import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";

dotenv.config();

const MODEL = "gemini-2.5-pro";

const PROMPT = `
For the currently uploaded manga page, perform a complete linguistic analysis and output the results as a single JSON object.

panels: An array of panels, ordered by the manga reading order (right-to-left, top-to-bottom).

Each panel in the array must be an object with the key panelNumber (integer), a key words, and a key grammars.

The words key must contain an array of objects.
Each word object must have the following keys: japanese (string), reading (string), meaning (string), partOfSpeech (string), and jlptLevel (integer).
grammars: An array of objects, containing all notable Japanese grammar structures found on the page.

The grammars key must contain an array of objects
Each grammar object must have the following keys: name (string), pattern (string), explanation (string), and jlptLevel (integer).
`.trim();

export type Word = {
  japanese: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
  jlptLevel: number;
}

export type GrammaticalStructure = {
  name: string;
  pattern: string;
  explanation: string;
  jlptLevel: number;
}

export type Panel = {
  panelNumber: number;
  words: Word[];
  grammars: GrammaticalStructure[];
}

export type ChapterResult = {
  chapterId: string;
  pages: Page[];
}

export type Page = {
  pageNumber: number;
  panels: Panel[];
}

type GeminiResult = {
  panels: Panel[];
}

async function splitPdfIntoSinglePagePdfs(
  pdfPath: string
): Promise<Uint8Array[]> {
  const absPdf = path.resolve(pdfPath);
  const bytes = await fs.readFile(absPdf);
  const srcDoc = await PDFDocument.load(bytes);
  const pageCount = srcDoc.getPageCount();

  const outputs: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const singlePageDoc = await PDFDocument.create();
    const [copiedPage] = await singlePageDoc.copyPages(srcDoc, [i]);
    singlePageDoc.addPage(copiedPage);
    const singleBytes = await singlePageDoc.save();
    outputs.push(singleBytes);
  }

  return outputs;
}

async function askGeminiForPagePdf(pagePdfBytes: Uint8Array): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set.");
  }

  const base64 = Buffer.from(pagePdfBytes).toString("base64");

  const client = new GoogleGenerativeAI(apiKey);
  const generativeModel = client.getGenerativeModel({ model: MODEL });

  const maxAttempts = 5;
  const backoffMS = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generativeModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64,
                },
              },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const text = result.response.text();
      if (!text) throw new Error("Empty Gemini response.");
      return JSON.parse(text) as GeminiResult;

    } catch (err) {
      if (attempt === maxAttempts) {
        throw err;
      }
      // Wait 2 seconds before retrying (simple exponential backoff could also be used)
      await new Promise(resolve => setTimeout(resolve, backoffMS));

      console.warn(
        `Gemini call failed on attempt ${attempt}/${maxAttempts}; retrying immediately...`
      );
    }
  }

  // Unreachable, but TypeScript wants a return.
  throw new Error("Unexpected error in askGeminiForPagePdf.");

}



export async function processChapter(
  pdfPath: string,
): Promise<void> {

  const chapterId = path.parse(pdfPath).name;
  const absPdf = path.resolve(pdfPath);
  const outputPath = path.join(process.cwd(),
      "chapter_outputs",
      `${path.basename(absPdf, path.extname(absPdf))}.json`
    );
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  console.log(`Splitting PDF into per-page PDFs: ${absPdf}`);
  const pagePdfs = await splitPdfIntoSinglePagePdfs(absPdf);

  if (pagePdfs.length === 0) {
    throw new Error("PDF has no pages.");
  }

  const chapterResult: ChapterResult = {
    chapterId: chapterId,
    pages: [],
  }


  for (let i = 0; i < pagePdfs.length; i++) {
    const pageNumber = i + 1;
    console.log(`Processing page ${pageNumber}/${pagePdfs.length}...`);
    const data = await askGeminiForPagePdf(pagePdfs[i]);

    const page = {
      pageNumber: pageNumber,
      panels: data.panels
    }
    
    chapterResult.pages.push(page);
    await fs.writeFile(outputPath, JSON.stringify(chapterResult, null, 2), "utf-8");

  }
  console.log(`Saved chapter JSON to ${outputPath}`);
}

async function run() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: ts-node processChapter.ts <chapter1.pdf> [chapter2.pdf ...]");
    process.exit(1);
  }

  const pdfs = args;

  for (const pdf of pdfs) {
    console.log(`=== Processing chapter: ${pdf} ===`);
    await processChapter(pdf);
  }
}

run();
