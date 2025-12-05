// consolidate ids of words between runs of transformtoSeed to avoid dups

import fs from "node:fs/promises";
import { OutputGrammaticalStructure, OutputWord, PanelGrammaticalStructure, PanelWord, SeedOutput } from "./transformToSeed";

function dedup(insertedSeedOutput: SeedOutput, newSeedOutput: SeedOutput) {
    const words = new Map<string, string>(); // japanese word to word id
    const newWordId = new Map<string, string>(); // new mapping of word ids

    const grammars = new Map<string, string>(); // grammar name to word id
    const newGrammarId = new Map<string, string>(); // new mapping of grammar ids

    for (const word of insertedSeedOutput.word) {
        words.set(word.japanese, word.id);
    }

    for (const grammar of insertedSeedOutput.grammaticalStructure) {
        grammars.set(grammar.name, grammar.id);
    }

    let newOutputWords: OutputWord[] = [];
    let newGrammaticalStructure: OutputGrammaticalStructure[] = [];
    let newPanelWord: PanelWord[] = [];
    let newPanelGrammaticalStructure: PanelGrammaticalStructure[] = [];

    for (const word of newSeedOutput.word) {
        if (words.has(word.japanese)) {
            newWordId.set(word.id, words.get(word.japanese) ?? "");
            continue;
        }
        newOutputWords.push(word);
    }

    for (const grammar of newSeedOutput.grammaticalStructure) {
        if (grammars.has(grammar.name)) {
            newGrammarId.set(grammar.id, grammars.get(grammar.name) ?? "");
            continue;
        }
        newGrammaticalStructure.push(grammar);
    }

    for (const panelWord of newSeedOutput.panelWord) {
        if (newWordId.has(panelWord.wordId)) {
            newPanelWord.push({
                panelId: panelWord.panelId,
                wordId: newWordId.get(panelWord.wordId) ?? ""
            });
        } else {
            newPanelWord.push(panelWord);
        }
    }

    for (const panelGrammar of newSeedOutput.panelGrammaticalStructure) {
        if (newGrammarId.has(panelGrammar.grammaticalStructureId)) {
            newPanelGrammaticalStructure.push({
                panelId: panelGrammar.panelId,
                grammaticalStructureId: newGrammarId.get(panelGrammar.grammaticalStructureId) ?? ""
            });
        } else {
            newPanelGrammaticalStructure.push(panelGrammar);
        }
    }

    newSeedOutput.word = newOutputWords;
    newSeedOutput.grammaticalStructure = newGrammaticalStructure;
    newSeedOutput.panelWord = newPanelWord;
    newSeedOutput.panelGrammaticalStructure = newPanelGrammaticalStructure;
}

async function fix() {
    const jsonString1 = await fs.readFile('seed_outputs/Yotsubato-ch1.json', "utf-8");
    const jsonString2 = await fs.readFile('seed_outputs/Yotsubato-ch2.json', 'utf-8');
    const insertedSeedOutput: SeedOutput = JSON.parse(jsonString1) as SeedOutput;
    const newSeedOutput: SeedOutput = JSON.parse(jsonString2) as SeedOutput;
    dedup(insertedSeedOutput, newSeedOutput);
    await fs.writeFile('seed_outputs/Yotsubato-ch2.json', JSON.stringify(newSeedOutput, null, 2), 'utf-8')
}

fix();