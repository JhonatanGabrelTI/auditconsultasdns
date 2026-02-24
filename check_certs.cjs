const { Pool } = require("pg");
const pool = new Pool({
    connectionString: "postgresql://postgres.dsmbfwzekaebuadjfcot:HtgxB4kP1xfBx7cm@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
});

async function check() {
    try {
        const res = await pool.query(`
      SELECT id, name, "certificatePath", "certificatePasswordHash"
      FROM companies 
      WHERE "certificatePath" IS NOT NULL OR "certificatePasswordHash" IS NOT NULL
      LIMIT 10
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
