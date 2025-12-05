// takes in outputs from Yotsubato

import dotenv from 'dotenv';
import fs from "node:fs/promises";
import { Client } from 'pg';
import { PanelWord, PanelGrammaticalStructure, OutputPanel, 
  OutputGrammaticalStructure, OutputWord, SeedOutput } from './transformToSeed';

function generateUUID(): string {
    return crypto.randomUUID();   
}

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL not found in environment variables.');
}

const client = new Client({
  connectionString: databaseUrl,
});

async function deleteAllRows(tableName: string) {
    // console.log(`Delete All rows from ${tableName}`);
    // await client.query(`TRUNCATE Table "${tableName}" CASCADE`);
}

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');
    // You can now use `client` to query the database.
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  }
}

async function seedChapter(chapterId: string, title: string, orderIndex: number) {
    // deleteAllRows("Chapter");
    const updatedAt = new Date().toISOString();
    await client.query(
        `INSERT INTO "Chapter" (id, title, "orderIndex", "updatedAt") VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [chapterId, title, orderIndex, updatedAt]
    );
}

async function seedPanel(panels: OutputPanel[]) {
    if (panels.length === 0) return;
    // deleteAllRows("Panel");

    // The order of columns must match the order of values
    const columns = [
      "\"id\"",
      "\"chapterId\"",
      "\"japaneseText\"",
      "\"translation\"",
      "\"orderIndex\"",
      "\"pageNumber\"",
      "\"updatedAt\""
    ];

    let paramIndex = 1;
    const values: string[] = [];
    const params: any[] = [];
    const updatedAt = new Date().toISOString();

    for (const panel of panels) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );

      params.push(
        panel.id,
        panel.chapterId,
        panel.japaneseText,
        panel.translation,
        panel.orderIndex,
        panel.pageNumber,
        updatedAt
      );
    }

    const query = `
      INSERT INTO "Panel" (${columns.join(", ")})
      VALUES ${values.join(", ")}
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(query, params);
}

async function seedWord(words: OutputWord[]) {
    if (words.length === 0) return;
    // deleteAllRows("Word");
    // Match the Panel style and quote all columns explicitly
    const columns = [
      "\"id\"",
      "\"japanese\"",
      "\"reading\"",
      "\"meaning\"",
      "\"partOfSpeech\"",
      "\"jlptLevel\"",
      "\"updatedAt\""
    ];

    let paramIndex = 1;
    const values: string[] = [];
    const params: any[] = [];
    const updatedAt = new Date().toISOString();

    for (const word of words) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      params.push(
        word.id,
        word.japanese,
        word.reading,
        word.meaning,
        word.partOfSpeech,
        word.jlptLevel,
        updatedAt
      );
    }

    const query = `
      INSERT INTO "Word" (${columns.join(", ")})
      VALUES ${values.join(", ")}
      ON CONFLICT ("japanese") DO NOTHING;
    `;
    await client.query(query, params);
}

async function seedGrammaticalStructure(grammaticalStructure: OutputGrammaticalStructure[]) {
    if (grammaticalStructure.length === 0) return;
    // deleteAllRows("GrammaticalStructure");
    // Quote all columns explicitly
    const columns = [
      "\"id\"",
      "\"name\"",
      "\"pattern\"",
      "\"explanation\"",
      "\"jlptLevel\"",
      "\"updatedAt\""
    ];

    let paramIndex = 1;
    const values: string[] = [];
    const params: any[] = [];
    const updatedAt = new Date().toISOString();

    for (const gs of grammaticalStructure) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      params.push(
        gs.id,
        gs.name,
        gs.pattern,
        gs.explanation,
        gs.jlptLevel,
        updatedAt
      );
    }

    const query = `
      INSERT INTO "GrammaticalStructure" (${columns.join(", ")})
      VALUES ${values.join(", ")}
      ON CONFLICT ("id") DO NOTHING;
    `;
    await client.query(query, params);
}

async function seedPanelWord(panelWord: PanelWord[]) {
    if (panelWord.length === 0) return;
    // deleteAllRows("PanelWord");
    // Quote columns for consistency
    const columns = [
      "\"id\"",
      "\"panelId\"",
      "\"wordId\"",
    ];

    let paramIndex = 1;
    const values: string[] = [];
    const params: any[] = [];

    for (const pw of panelWord) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      params.push(
        generateUUID(),
        pw.panelId,
        pw.wordId,
      );
    }

    const query = `
      INSERT INTO "PanelWord" (${columns.join(", ")})
      VALUES ${values.join(", ")}
      ON CONFLICT DO NOTHING;
    `;
    await client.query(query, params);
}

async function seedPanelGrammaticalStructure(panelGrammaticalStructure: PanelGrammaticalStructure[]) {
    if (panelGrammaticalStructure.length === 0) return;
    // deleteAllRows("PanelGrammaticalStructure");
    // Quote columns for consistency
    const columns = [
      "\"id\"",
      "\"panelId\"",
      "\"grammaticalStructureId\"",
    ];

    let paramIndex = 1;
    const values: string[] = [];
    const params: any[] = [];

    for (const pgs of panelGrammaticalStructure) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      params.push(
        generateUUID(),
        pgs.panelId,
        pgs.grammaticalStructureId,
      );
    }

    const query = `
      INSERT INTO "PanelGrammaticalStructure" (${columns.join(", ")})
      VALUES ${values.join(", ")}
      ON CONFLICT DO NOTHING;
    `;
    await client.query(query, params);
}

async function seedDatabase(seedOutputPath: string, chapterTitle: string, orderIndex: number) {
    const jsonString = await fs.readFile(seedOutputPath, "utf-8");
    const seedOutput = JSON.parse(jsonString) as SeedOutput;

    await seedChapter(seedOutput.chapterId, chapterTitle, orderIndex);
    await seedPanel(seedOutput.panel);
    await seedWord(seedOutput.word);
    await seedGrammaticalStructure(seedOutput.grammaticalStructure);
    await seedPanelWord(seedOutput.panelWord);
    await seedPanelGrammaticalStructure(seedOutput.panelGrammaticalStructure);
}


async function run() {

    await connectToDatabase();

    // change args to seed database
    const args = [
        {
            chapterName: 'Yotsubato-ch2',
            chapterTitle: 'Yotsuba & Manners',
            orderIndex: 2
        }
    ]
    
    for (const arg of args) {
        const {chapterName, chapterTitle, orderIndex} = arg;
        console.log(`seeding ${chapterName} ${chapterTitle} ${orderIndex}`)
        const inputPath = `seed_outputs/${chapterName}.json`
        await seedDatabase(inputPath, chapterTitle, orderIndex);
    }

    await client.end();
    console.log("Database connection closed.");
}

run();

