import "dotenv/config";
import * as db from './server/db';
import { apiConsultas, companies } from './drizzle/schema';
import { like, or } from 'drizzle-orm';

async function searchMocks() {
    const dbase = await db.getDb();
    if (!dbase) {
        console.log("No DB connection");
        return;
    }

    console.log("Searching for mock signatures...");

    const mockSignatures = [
        "%EMPRESA DE TESTE%",
        "%EMPRESA ESTADUAL LTDA%",
        "%EMPRESA FGTS TESTE%",
        "%EMPRESA ECAC TESTE%",
        "%2024.000123456-78%",
        "%dummy.pdf%"
    ];

    for (const sig of mockSignatures) {
        const results = await dbase.select().from(apiConsultas).where(
            or(
                like(apiConsultas.respostaCompleta, sig),
                like(apiConsultas.situacao, sig),
                like(apiConsultas.numeroCertidao, sig),
                like(apiConsultas.siteReceipt, sig)
            )
        );
        if (results.length > 0) {
            console.log(`Signature [${sig}] found in ${results.length} records in api_consultas.`);
        }
    }

    const companyMocks = await dbase.select().from(companies).where(
        or(
            like(companies.name, "%EMPRESA DE TESTE%"),
            like(companies.name, "%TESTE%")
        )
    );
    if (companyMocks.length > 0) {
        console.log(`Found ${companyMocks.length} mock companies.`);
        console.log(companyMocks.map(c => ({ id: c.id, name: c.name, cnpj: c.cnpj })));
    }
}

searchMocks().catch(console.error);
