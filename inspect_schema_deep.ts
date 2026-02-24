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

async function inspectSchemaDeep() {
    try {
        console.log("--- Schema Inspection: public.companies ---");
        const companyCols = await client`
      SELECT table_schema, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'companies' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
        console.table(companyCols);

        console.log("\n--- Schema Inspection: public.users ---");
        const userCols = await client`
      SELECT table_schema, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
        console.table(userCols);

        console.log("\n--- Unique Constraints check on public.companies ---");
        const uniqueCheck = await client`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND contype = 'u' AND conrelid = 'public.companies'::regclass;
    `;
        console.table(uniqueCheck);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

inspectSchemaDeep();
