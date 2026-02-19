/**
 * Servidor Express Simplificado - Módulo de Cobrança
 * Roda em porta 3001
 */

const express = require('express');
const app = express();
const PORT = 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Log de requisições
app.use((req: any, res: any, next: any) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROTAS ====================

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'OK',
    modulo: 'Cobrança Bradesco',
    versao: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Boletos
app.post('/boletos', (req: any, res: any) => {
  console.log('[POST /boletos]', req.body);
  res.status(201).json({
    sucesso: true,
    mensagem: 'Boleto emitido (mock)',
    boleto: {
      id: 'mock-' + Date.now(),
      nossoNumero: '00000' + Math.floor(Math.random() * 100000),
      seuNumero: req.body.seuNumero,
      valor: req.body.valor,
      linhaDigitavel: '23790.12340 56789.012345 67890.123456 7 89010000001500',
      codigoBarras: '23797890100000015001234056789012345678901234',
    },
  });
});

app.get('/boletos', (req: any, res: any) => {
  res.json({
    sucesso: true,
    boletos: [],
    paginacao: { page: 1, limit: 50 },
  });
});

app.get('/boletos/:id', (req: any, res: any) => {
  res.json({
    sucesso: true,
    boleto: {
      id: req.params.id,
      status: '01',
      mensagem: 'Consulta mock',
    },
  });
});

// Webhook
app.post('/webhook/bradesco', (req: any, res: any) => {
  console.log('[Webhook recebido]', req.body);
  res.status(200).json({ recebido: true });
});

// 404
app.use((req: any, res: any) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Iniciar
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║    MÓDULO DE COBRANÇA - BRADESCO          ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  🚀 http://localhost:${PORT}                   ║`);
  console.log('║                                           ║');
  console.log('║  Endpoints:                               ║');
  console.log('║  • GET  /health                           ║');
  console.log('║  • POST /boletos                          ║');
  console.log('║  • GET  /boletos                          ║');
  console.log('║  • GET  /boletos/:id                      ║');
  console.log('║  • POST /webhook/bradesco                 ║');
  console.log('╚═══════════════════════════════════════════╝');
});
