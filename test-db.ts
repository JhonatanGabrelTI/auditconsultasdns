import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  ssl: 'require',
});

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function test() {
  try {
    // Check users
    const users = await sql`SELECT * FROM users`;
    console.log('Users:', users);
    
    if (users.length === 0) {
      console.log('No users found. Creating test user...');
      const user = await sql`
        INSERT INTO users ("openId", name, email, role)
        VALUES ('test-openid-123', 'Test User', 'test@test.com', 'admin')
        RETURNING *
      `;
      console.log('Created user:', user);
    }
    
    // Get first user
    const firstUser = await sql`SELECT id FROM users LIMIT 1`;
    const userId = firstUser[0]?.id;
    console.log('Using userId:', userId);
    
    // Try insert with valid user
    console.log('Trying test insert...');
    const testId = generateUUID();
    
    const insert = await sql`
      INSERT INTO companies (
        id, "userId", "personType", name, cnpj, "taxRegime", emails, whatsapps
      ) VALUES (
        ${testId}, ${userId}, 'juridica', 'Test Company', '12345678000195', 'simples_nacional', 
        ${JSON.stringify(['test@test.com'])}, ${JSON.stringify(['11999999999'])}
      ) RETURNING id
    `;
    console.log('Insert successful:', insert);
    
    // Cleanup
    await sql`DELETE FROM companies WHERE id = ${testId}`;
    console.log('Cleanup done');
    
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await sql.end();
  }
}

test();
