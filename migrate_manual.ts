
import { sql } from "drizzle-orm";
import { getDb } from "./server/db";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const db = await getDb();
    if (!db) {
        console.error("Failed to connect to database");
        process.exit(1);
    }

    console.log("Running migration...");

    try {
        await db.execute(sql`
      ALTER TABLE api_consultas 
      ADD COLUMN IF NOT EXISTS "validadeFim" timestamp,
      ADD COLUMN IF NOT EXISTS "siteReceipt" text;
    `);

        // Also ensure existing columns are correct type if needed, but IF NOT EXISTS handles new ones

        console.log("Migration completed successfully");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
