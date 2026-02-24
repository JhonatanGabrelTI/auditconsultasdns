
import "dotenv/config";
import postgres from "postgres";

async function testConnection() {
    const regions = ["sa-east-1", "us-east-1", "us-west-1", "eu-central-1"];
    const refs = ["dsmbfwzekaebuadjfcot", "apbkobhfnmcqqzqeeqss"];
    const password = "HtgxB4kP1xfBx7cm";

    for (const ref of refs) {
        for (const region of regions) {
            const host = `aws-0-${region}.pooler.supabase.com`;
            const connectionString = `postgresql://postgres.${ref}:${password}@${host}:6543/postgres`;
            console.log(`Testing ${ref} in ${region}...`);

            const sql = postgres(connectionString, { timeout: 5 });
            try {
                await sql`SELECT 1`;
                console.log(`SUCCESS! Connected to ${ref} in ${region}`);
                process.exit(0);
            } catch (error) {
                console.log(`Failed: ${error.message}`);
            } finally {
                await sql.end();
            }
        }
    }
}

testConnection();
