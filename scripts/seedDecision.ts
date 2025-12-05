import { Client } from "pg";
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL not found in environment variables.');
}

const client = new Client({
  connectionString: databaseUrl,
});

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

async function updateAutoDisqualifyColumn() {

    const query = `
        UPDATE "Panel"
        SET "autoDisqualify" = TRUE
        WHERE LENGTH("japaneseText") < 10
          OR NOT EXISTS (
            SELECT 1
            FROM "PanelGrammaticalStructure"
            WHERE "PanelGrammaticalStructure"."panelId" = "Panel"."id"
          )
    `;

    await client.query(query);
    console.log('updating autodisqualify panel table')
}

async function run() {
    await connectToDatabase();
    await updateAutoDisqualifyColumn();
    await client.end();
    console.log("Database connection closed.");
}

run();

