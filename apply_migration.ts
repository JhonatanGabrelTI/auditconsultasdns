import "dotenv/config";
import postgres from "postgres";

async function migrate() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    try {
        await sql`
      ALTER TABLE public.api_consultas 
      ADD COLUMN IF NOT EXISTS "validadeFim" timestamp,
      ADD COLUMN IF NOT EXISTS "siteReceipt" text;
    `;
        console.log("Migration applied successfully: columns validadeFim and siteReceipt added to api_consultas");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await sql.end();
    }
}

migrate();
