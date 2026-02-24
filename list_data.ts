import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

const client = postgres(databaseUrl, { prepare: false });

async function listData() {
    try {
        console.log("--- Data: public.companies ---");
        const companies = await client`SELECT id, name, cnpj, "userId" FROM public.companies;`;
        console.table(companies);

        console.log("\n--- Data: public.users ---");
        const users = await client`SELECT id, "openId", name FROM public.users;`;
        console.table(users);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listData();
