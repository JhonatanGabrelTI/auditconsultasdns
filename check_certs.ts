import "dotenv/config";
import { getDb } from "./server/db";
import { companies } from "./drizzle/schema";
import { isNotNull, or } from "drizzle-orm";

async function check() {
    const db = await getDb();
    if (!db) {
        console.error("No DB connection");
        return;
    }

    const results = await db.select().from(companies)
        .where(or(isNotNull(companies.certificatePath), isNotNull(companies.certificatePasswordHash)));

    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
}

check();
