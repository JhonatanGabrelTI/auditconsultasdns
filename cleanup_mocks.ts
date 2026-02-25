import "dotenv/config";
import * as db from './server/db';
import { apiConsultas } from './drizzle/schema';
import { like } from 'drizzle-orm';

async function cleanup() {
    const dbase = await db.getDb();
    if (!dbase) {
        console.log("No DB connection");
        return;
    }

    console.log("Searching for mock records (dummy.pdf)...");

    // Find records with dummy.pdf
    const mockRecords = await dbase.select().from(apiConsultas).where(like(apiConsultas.siteReceipt, "%dummy.pdf%"));

    console.log(`Found ${mockRecords.length} mock records.`);

    if (mockRecords.length > 0) {
        console.log("Deleting mock records...");
        const result = await dbase.delete(apiConsultas).where(like(apiConsultas.siteReceipt, "%dummy.pdf%")).returning();
        console.log(`Deleted ${result.length} records.`);
    }

    console.log("Cleanup complete.");
}

cleanup().catch(console.error);
