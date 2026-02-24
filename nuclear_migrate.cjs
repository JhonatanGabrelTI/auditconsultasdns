const postgres = require("postgres");
require("dotenv").config();

async function nuclearMigrate() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    try {
        console.log("Starting nuclear migration for api_consultas...");

        // 1. Drop the table
        await sql`DROP TABLE IF EXISTS public.api_consultas CASCADE`;
        console.log("- Table dropped.");

        // 2. Create the table matching Drizzle schema exactly
        await sql`
      CREATE TABLE public.api_consultas (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES public.users(id),
        "companyId" UUID NOT NULL REFERENCES public.companies(id),
        "tipoConsulta" TEXT NOT NULL,
        situacao TEXT,
        "numeroCertidao" TEXT,
        "dataEmissao" TIMESTAMP,
        "dataValidade" TIMESTAMP,
        "respostaCompleta" TEXT,
        sucesso BOOLEAN NOT NULL DEFAULT FALSE,
        "mensagemErro" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "validadeFim" TIMESTAMP,
        "siteReceipt" TEXT
      )
    `;
        console.log("- Table created with correct columns.");

        console.log("Nuclear migration applied successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await sql.end();
    }
}

nuclearMigrate();
