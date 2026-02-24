import "dotenv/config";
import postgres from "postgres";

async function inspect() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    try {
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'api_consultas'
    `;
        console.log("Columns in api_consultas:");
        console.log(JSON.stringify(columns, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

inspect();
