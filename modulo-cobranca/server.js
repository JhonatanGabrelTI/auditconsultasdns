/**
 * Servidor Express - Módulo de Cobrança
 * Versão JavaScript (sem TypeScript)
 */

const express = require('express');
const app = express();
const PORT = 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROTAS ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    modulo: 'Cobrança Bradesco',
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Página inicial
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Módulo de Cobrança</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f0f2f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        .endpoint { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #fff; background: #007bff; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏦 Módulo de Cobrança</h1>
        <p>Bradesco API v1.7.1</p>
        
        <div class="status">
          <strong>✅ Servidor Online!</strong><br>
          Porta: ${PORT}<br>
          Horário: ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <h3>Endpoints disponíveis:</h3>
        
        <div class="endpoint">
          <span class="method">GET</span> <code>/health</code> - Status do sistema
        </div>
        
        <div class="endpoint">
          <span class="method">POST</span> <code>/boletos</code> - Emitir boleto
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <code>/boletos</code> - Listar boletos
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <code>/boletos/:id</code> - Consultar boleto
        </div>
        
        <div class="endpoint">
          <span class="method">POST</span> <code>/webhook/bradesco</code> - Webhook
        </div>
        
        <h3>Teste rápido:</h3>
        <p>Abra o console (F12) e execute:</p>
        <pre style="background:#f4f4f4;padding:10px;border-radius:5px;">
fetch('/health')
  .then(r => r.json())
  .then(data => console.log(data));</pre>
      </div>
    </body>
    </html>
  `);
});

// POST /boletos
app.post('/boletos', (req, res) => {
  console.log('Emitindo boleto:', req.body);
  res.status(201).json({
    sucesso: true,
    mensagem: 'Boleto emitido',
    boleto: {
      id: 'BOL-' + Date.now(),
      nossoNumero: '00000' + Math.floor(Math.random() * 100000),
      seuNumero: req.body.seuNumero || 'DOC001',
      valor: req.body.valor || 0,
      linhaDigitavel: '23790.12340 56789.012345 67890.123456 7 89010000001500',
      codigoBarras: '23797890100000015001234056789012345678901234'
    }
  });
});

// GET /boletos
app.get('/boletos', (req, res) => {
  res.json({
    sucesso: true,
    boletos: [],
    paginacao: { page: 1, limit: 50, total: 0 }
  });
});

// GET /boletos/:id
app.get('/boletos/:id', (req, res) => {
  res.json({
    sucesso: true,
    boleto: {
      id: req.params.id,
      status: '01',
      mensagem: 'Mock de consulta'
    }
  });
});

// Webhook
app.post('/webhook/bradesco', (req, res) => {
  console.log('Webhook recebido:', req.body);
  res.json({ recebido: true });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada: ' + req.path });
});

// Iniciar
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║    ✅ MÓDULO DE COBRANÇA INICIADO!        ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  🌐 http://localhost:${PORT}                    ║`);
  console.log(`║  🌐 http://127.0.0.1:${PORT}                    ║`);
  console.log('║                                           ║');
  console.log('║  Endpoints:                               ║');
  console.log('║  • GET  /                                 ║');
  console.log('║  • GET  /health                           ║');
  console.log('║  • POST /boletos                          ║');
  console.log('║  • GET  /boletos                          ║');
  console.log('║  • GET  /boletos/:id                      ║');
  console.log('║  • POST /webhook/bradesco                 ║');
  console.log('╚═══════════════════════════════════════════╝\n');
});
