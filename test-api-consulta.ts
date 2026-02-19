import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  ssl: 'require',
});

async function test() {
  try {
    // Check api_consultas table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'api_consultas'
      ORDER BY ordinal_position
    `;
    console.log('api_consultas columns:');
    columns.forEach((c: any) => {
      console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
    });
    
    // Try insert with minimal data
    console.log('\nTrying minimal insert...');
    try {
      const result = await sql`
        INSERT INTO api_consultas (
          "userId", "companyId", "tipoConsulta", "status"
        ) VALUES (
          1, '55f37fbe-bb56-4806-afb5-a51d182bc9e9', 'cnd_federal', 'success'
        ) RETURNING id
      `;
      console.log('Minimal insert successful:', result);
      
      // Cleanup
      await sql`DELETE FROM api_consultas WHERE id = ${result[0].id}`;
      console.log('Cleanup done');
    } catch (e: any) {
      console.error('Minimal insert failed:', e.message);
      console.error('Error code:', e.code);
      console.error('Error detail:', e.detail);
    }
    
    // Try insert with all fields
    console.log('\nTrying full insert...');
    try {
      const result = await sql`
        INSERT INTO api_consultas (
          "userId", "companyId", "tipoConsulta", "cnpjConsultado", 
          "status", "resultado", "custo"
        ) VALUES (
          1, '55f37fbe-bb56-4806-afb5-a51d182bc9e9', 'cnd_federal', '09157307000175',
          'success', '{"test": true}', '0.22'
        ) RETURNING id
      `;
      console.log('Full insert successful:', result);
      
      // Cleanup
      await sql`DELETE FROM api_consultas WHERE id = ${result[0].id}`;
      console.log('Cleanup done');
    } catch (e: any) {
      console.error('Full insert failed:', e.message);
      console.error('Error code:', e.code);
      console.error('Error detail:', e.detail);
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

test();
