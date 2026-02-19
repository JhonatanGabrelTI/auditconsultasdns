import 'dotenv/config';

const INFOSIMPLES_API_TOKEN = process.env.INFOSIMPLES_API_TOKEN;

async function testInfoSimples() {
  console.log('Token exists:', !!INFOSIMPLES_API_TOKEN);
  console.log('Token (first 20 chars):', INFOSIMPLES_API_TOKEN?.substring(0, 20));
  
  try {
    const response = await fetch('https://api.infosimples.com/api/v2/consultas/receita-federal/pgfn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: INFOSIMPLES_API_TOKEN,
        cnpj: '09157307000175',
        preferencia_emissao: 'nova',
      }),
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testInfoSimples();
