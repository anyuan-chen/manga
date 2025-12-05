/**
 * Script to calculate and update statistics for all chapters
 *
 * Usage: npx tsx scripts/updateChapterStats.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file BEFORE importing other modules
config({ path: resolve(__dirname, '../.env') });

async function main() {
  try {
    // Import after dotenv is loaded
    const { updateAllChapterStats } = await import('../lib/chapterStats');
    await updateAllChapterStats();
    process.exit(0);
  } catch (error) {
    console.error('Failed to update chapter stats:', error);
    process.exit(1);
  }
}

main();
