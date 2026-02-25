import "dotenv/config";
import * as db from './server/db';
import { companies, digitalCertificates } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function test() {
    const dbase = await db.getDb();
    if (!dbase) {
        console.log("No DB connection");
        return;
    }

    const allCompanies = await dbase.select().from(companies).limit(1);
    if (allCompanies.length === 0) {
        console.log("No companies found to test with");
        return;
    }

    const companyId = allCompanies[0].id;
    console.log(`Testing insert for company: ${companyId}`);

    try {
        const result = await dbase.insert(digitalCertificates).values({
            companyId: companyId,
            name: "Test Cert",
            path: "test_path",
            passwordHash: "test_pass",
            active: true
        }).returning();
        console.log("Insert result:", result);
    } catch (e) {
        console.error("Insert failed:", e);
    }
}

test().catch(console.error);
