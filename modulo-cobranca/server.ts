/**
 * Servidor Express - Módulo de Cobrança
 * Roda em porta diferente do sistema principal (3001)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROTAS ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    modulo: 'Cobrança Bradesco',
    versao: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Rotas de Boletos
app.post('/boletos', async (req, res) => {
  try {
    // TODO: Implementar chamada ao BoletoController
    res.status(201).json({
      sucesso: true,
      mensagem: 'Boleto emitido com sucesso (mock)',
      boleto: {
        id: 'mock-id',
        nossoNumero: '00000123456',
        seuNumero: req.body.seuNumero,
        valor: req.body.valor,
        linhaDigitavel: '23790.12340 56789.012345 67890.123456 7 89010000001500',
        codigoBarras: '23797890100000015001234056789012345678901234',
      },
    });
  } catch (error: any) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

app.get('/boletos/:id', async (req, res) => {
  res.json({
    sucesso: true,
    boleto: {
      id: req.params.id,
      status: '01',
      mensagem: 'Consulta mock - implementar integração',
    },
  });
});

app.get('/boletos', async (req, res) => {
  res.json({
    sucesso: true,
    boletos: [],
    paginacao: { page: 1, limit: 50 },
  });
});

app.post('/boletos/lote', async (req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'Lote processado (mock)',
    resumo: { total: 0, sucessos: 0, erros: 0 },
  });
});

app.post('/boletos/:id/baixa', async (req, res) => {
  res.json({ sucesso: true, mensagem: 'Baixa solicitada' });
});

app.post('/boletos/:id/protesto', async (req, res) => {
  res.json({ sucesso: true, mensagem: 'Protesto solicitado' });
});

app.get('/boletos/:id/pdf', async (req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'PDF gerado',
    url: `http://localhost:${PORT}/pdfs/boleto-${req.params.id}.pdf`,
  });
});

// Rotas de Configuração
app.get('/configuracoes', async (req, res) => {
  res.json({
    sucesso: true,
    configuracoes: [{
      id: 'mock-config',
      nomeBeneficiario: 'Empresa Exemplo',
      agencia: '1234',
      conta: '123456',
      carteira: '09',
    }],
  });
});

app.post('/configuracoes', async (req, res) => {
  res.status(201).json({
    sucesso: true,
    mensagem: 'Configuração criada',
    configuracao: { id: 'new-uuid', ...req.body },
  });
});

// Webhook Bradesco
app.post('/webhook/bradesco', async (req, res) => {
  // Retornar imediatamente (ACK)
  res.status(200).json({ recebido: true });
  
  // Processar assíncrono
  console.log('[Webhook] Notificação recebida:', req.body);
});

// Estatísticas
app.get('/estatisticas', async (req, res) => {
  res.json({
    sucesso: true,
    estatisticas: {
      totalBoletos: 0,
      pendentes: 0,
      pagos: 0,
      vencidos: 0,
    },
  });
});

// ==================== ERROS ====================

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Handler de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Erro]', err);
  res.status(500).json({
    erro: 'Erro interno do servidor',
    mensagem: err.message,
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     MÓDULO DE COBRANÇA - BRADESCO API v1.7.1       ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  🚀 Servidor rodando em: http://localhost:${PORT}      ║`);
  console.log('║                                                    ║');
  console.log('║  Endpoints disponíveis:                            ║');
  console.log('║  • GET  /health           - Status do sistema      ║');
  console.log('║  • POST /boletos          - Emitir boleto          ║');
  console.log('║  • GET  /boletos          - Listar boletos         ║');
  console.log('║  • GET  /boletos/:id      - Consultar boleto       ║');
  console.log('║  • POST /boletos/lote     - Emitir lote            ║');
  console.log('║  • POST /webhook/bradesco - Webhook de liquidação  ║');
  console.log('║                                                    ║');
  console.log('║  📚 Documentação: ./README.md                      ║');
  console.log('╚════════════════════════════════════════════════════╝');
});
