const postgres = require("postgres");
require("dotenv").config();

async function inspect() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    try {
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'api_consultas'
      AND table_schema = 'public'
    `;
        console.log("Columns in api_consultas:");
        console.log(JSON.stringify(columns, null, 2));

        console.log("ENV TOKEN:", process.env.INFOSIMPLES_API_TOKEN ? "FOUND (starts with " + process.env.INFOSIMPLES_API_TOKEN.substring(0, 5) + ")" : "NOT FOUND");
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

inspect();
