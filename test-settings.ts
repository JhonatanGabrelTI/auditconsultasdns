import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  ssl: 'require',
});

async function test() {
  try {
    // Check settings table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'settings'
      ORDER BY ordinal_position
    `;
    console.log('settings columns:');
    columns.forEach((c: any) => {
      console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
    });
    
    // Try select
    console.log('\nTrying select...');
    try {
      const result = await sql`SELECT * FROM settings WHERE "userId" = 1 LIMIT 1`;
      console.log('Select result:', result);
    } catch (e: any) {
      console.error('Select failed:', e.message);
      console.error('Error code:', e.code);
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

test();
