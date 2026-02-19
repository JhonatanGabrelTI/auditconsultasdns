/**
 * Servidor de Teste - Módulo de Cobrança
 * Versão mínima para diagnóstico
 */

const http = require('http');

const PORT = 3001;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - IP: ${req.socket.remoteAddress}`);
  
  res.writeHead(200, { 
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Módulo de Cobrança - TESTE</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 40px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      margin: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      padding: 40px; 
      border-radius: 15px; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #333; margin-bottom: 20px; }
    .success { 
      background: #d4edda; 
      border-left: 5px solid #28a745; 
      padding: 20px; 
      margin: 20px 0; 
      border-radius: 8px;
      font-size: 18px;
    }
    .info {
      background: #e7f3ff;
      border-left: 5px solid #0066cc;
      padding: 15px;
      margin: 15px 0;
      border-radius: 8px;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    .btn {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      text-decoration: none;
      margin: 10px 5px;
      font-weight: bold;
    }
    .btn:hover {
      background: #764ba2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 SUCESSO!</h1>
    
    <div class="success">
      <strong>✅ O servidor está funcionando!</strong><br><br>
      Você conseguiu acessar o módulo de cobrança na porta ${PORT}.
    </div>
    
    <div class="info">
      <strong>Informações:</strong><br>
      • Porta: <code>${PORT}</code><br>
      • Horário: <code>${new Date().toLocaleString('pt-BR')}</code><br>
      • URL: <code>http://localhost:${PORT}</code>
    </div>
    
    <p>Se você está vendo esta página, significa que:</p>
    <ul>
      <li>✅ O Node.js está funcionando</li>
      <li>✅ O servidor está rodando</li>
      <li>✅ A porta ${PORT} está acessível</li>
    </ul>
    
    <div style="margin-top: 30px;">
      <a href="/health" class="btn">Testar API</a>
      <a href="/boletos" class="btn">Ver Boletos</a>
    </div>
  </div>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🚀 SERVIDOR DE TESTE INICIADO!           ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  Porta: ${PORT}                              ║`);
  console.log('║                                           ║');
  console.log(`║  👉 http://localhost:${PORT}                   ║`);
  console.log(`║  👉 http://127.0.0.1:${PORT}                   ║`);
  console.log('║                                           ║');
  console.log('║  Aguardando conexões...                   ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
  console.log('💡 DICA: Abra o navegador e acesse:');
  console.log(`   http://localhost:${PORT}`);
  console.log('');
  console.log('⏹️  Pressione Ctrl+C para parar');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ERRO: A porta ${PORT} já está em uso!`);
    console.error('   Tente fechar outros programas ou use outra porta.');
  } else {
    console.error('❌ ERRO:', err.message);
  }
  process.exit(1);
});
