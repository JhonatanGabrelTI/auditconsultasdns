const { Pool } = require("pg");
const pool = new Pool({
    connectionString: "postgresql://postgres.dsmbfwzekaebuadjfcot:HtgxB4kP1xfBx7cm@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
});

async function check() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'api_consultas' 
      ORDER BY ordinal_position
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
