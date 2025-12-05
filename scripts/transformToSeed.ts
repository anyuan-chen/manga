// transforms annotated json to data to seed the database
import fs from "node:fs/promises";
import path from "node:path";
import { ChapterResult, GrammaticalStructure, Word } from "./processChapter";

interface PanelWord {
  panelId: string;
  wordId: string;
}

interface PanelGrammaticalStructure {
    panelId: string;
    grammaticalStructureId: string;
}

interface OutputPanel {
    id: string;
    chapterId: string;
    japaneseText: string;
    translation:  string;
    orderIndex: number; 

    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface OutputGrammaticalStructure {
    id: string;
    name: string;
    pattern: string;
    explanation: string;
    jlptLevel: number;
}

interface OutputWord {
    id: string;
    japanese: string;
    reading: string;
    meaning: string;
    partOfSpeech: string;
    jlptLevel: number;
}

interface SeedOutput {
    chapterId: string;
    panel: OutputPanel[];
    word: OutputWord[];
    grammaticalStructure: OutputGrammaticalStructure[];
    panelWord: PanelWord[];
    panelGrammaticalStructure: PanelGrammaticalStructure[];
}


function generateUUID(): string {
    return crypto.randomUUID();   
}


function getSeedJSON(input: ChapterResult) {

    const chapterId = input.chapterId;
    const wordMap = new Map<Word, string[]>(); // <word in japanese, page + panel numbers>
    const grammarMap = new Map<GrammaticalStructure, string[]>(); // grammar in japanese, page + panel numbers>

    const panelWordTable: PanelWord[] = [];
    const panelGrammaticalStructureTable: PanelGrammaticalStructure[] = [];

    const outputPanels: OutputPanel[] = [];
    const outputWords: OutputWord[] = [];
    const outputGrammaticalStructure: OutputGrammaticalStructure[] = [];
    
    let orderIndex = 0;

    for (const page of input.pages) {
       
        if (!page.panels) {
            console.log(`Page ${page.pageNumber} doesn't have any panels`);
            continue;
        }
        for (const panel of page.panels) {
            const panelId = generateUUID();

            let japaneseText = "";
            let translation = "";

            for (const word of panel.words) {
                wordMap.set(word, [...wordMap.get(word) ?? [], panelId]);
                japaneseText += word.japanese;
                translation += word.meaning;
            }
           
            outputPanels.push({
                id: panelId,
                chapterId,
                japaneseText,
                translation,
                orderIndex,
                pageNumber: page.pageNumber,
                x: 0,
                y: 0,
                width: 0,
                height: 0
            });

            orderIndex += 1; // every panel gets an order index

            if (panel.grammars) { // some panels might not have grammars
                for (const grammar of panel.grammars) {
                    grammarMap.set(grammar, [...grammarMap.get(grammar) ?? [], panelId]);
                }
            }
        }
    }

    for (const [word, panelIds] of wordMap.entries()) {
        const wordId = generateUUID();
        outputWords.push({
            id: wordId,
            ...word
        });

        for (const panelId of panelIds) {
            panelWordTable.push({
                wordId,
                panelId
            })
        }
    } 

    for (const [grammaticalStructure, panelIds] of grammarMap.entries()) {
        const grammaticalStructureId = generateUUID();
        outputGrammaticalStructure.push({
            id: grammaticalStructureId,
            ...grammaticalStructure
        });

        for (const panelId of panelIds) {
            panelGrammaticalStructureTable.push({
                grammaticalStructureId,
                panelId
            })
        }
    }

    const seedOutput: SeedOutput = {
        chapterId,
        panel: outputPanels,
        word: outputWords,
        grammaticalStructure: outputGrammaticalStructure,
        panelWord: panelWordTable,
        panelGrammaticalStructure: panelGrammaticalStructureTable
    } 

    return seedOutput;
  
}

async function outputSeedJSON(inputPath: string, outputPath: string) {

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const jsonString = await fs.readFile(inputPath, "utf-8");
    const chapterResult: ChapterResult = JSON.parse(jsonString) as ChapterResult;
    const seedOutput = getSeedJSON(chapterResult);
    await fs.writeFile(outputPath, JSON.stringify(seedOutput, null, 2), "utf-8");
}

async function run() {
    const args = process.argv.slice(2);
  
    if (args.length === 0) {
      console.error("Usage: ts-node transformToSeed.ts <chapter1> [chapter2 ...]");
      process.exit(1);
    }

    const chapters = args;
  
    for (const chapter of chapters) {
      console.log(`=== Processing chapter: ${chapter} ===`);
      const inputPath = `chapter_outputs/${chapter}.json`
      const outputPath = `seed_outputs/${chapter}.json`
      await outputSeedJSON(inputPath, outputPath);
    }
}

run();