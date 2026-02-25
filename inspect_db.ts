import "dotenv/config";
import * as db from './server/db';
import { users, companies, apiConsultas, digitalCertificates } from './drizzle/schema';
import { eq, desc } from 'drizzle-orm';

async function inspect() {
    const dbase = await db.getDb();
    if (!dbase) {
        console.log("No DB connection");
        return;
    }

    const allUsers = await dbase.select().from(users);
    console.log("--- USERS ---");
    console.log(allUsers);

    for (const user of allUsers) {
        const userCompanies = await dbase.select().from(companies).where(eq(companies.userId, user.id));
        console.log(`--- COMPANIES FOR USER ${user.id} (${user.name}) ---`);
        console.log(userCompanies.map(c => ({
            id: c.id,
            name: c.name,
            cnpj: c.cnpj,
            certPath: c.certificatePath,
            certPass: c.certificatePasswordHash
        })));
    }

    const recentConsultas = await dbase.select().from(apiConsultas).orderBy(desc(apiConsultas.id)).limit(10);
    console.log("--- RECENT CONSULTAS ---");
    console.log(recentConsultas.map(c => ({
        id: c.id,
        tipo: c.tipoConsulta,
        sucesso: c.sucesso,
        msg: c.mensagemErro,
        situacao: c.situacao,
        timestamp: c.createdAt
    })));

    const allCerts = await dbase.select().from(digitalCertificates);
    console.log("--- DIGITAL CERTIFICATES ---");
    console.log(allCerts);
}

inspect().catch(e => {
    console.error("FATAL ERROR in inspect_db.ts:");
    console.error(e);
    process.exit(1);
});
