/**
 * Módulo de Cobrança - Bradesco
 * 
 * Sistema completo de gestão de boletos integrado à API Bradesco v1.7.1
 * 
 * Funcionalidades:
 * - Emissão de boletos (individual e em lote)
 * - Consulta e monitoramento de títulos
 * - Conciliação automática
 * - Cobrança ativa (notificações)
 * - Protesto e baixa automáticos
 * 
 * Arquitetura: Camadas (Controllers → Services → Repositories)
 */

// Exportações de Entidades
export * from './entities/ConfiguracaoCobranca';
export * from './entities/ClientePagador';
export * from './entities/Boleto';
export * from './entities/LoteProcessamento';
export * from './entities/WebhookRecebido';
export * from './entities/HistoricoStatus';

// Exportações de Tipos
export * from './types/bradesco-api.types';

// Exportações de Services
export { BradescoIntegrationService } from './services/BradescoIntegrationService';
export { BoletoService, EmitirBoletoDTO, ResultadoEmissao } from './services/BoletoService';

// Exportações de Controllers
export { BoletoController } from './controllers/BoletoController';
export { WebhookController } from './controllers/WebhookController';

// Exportações de Jobs
export { CobrancaScheduler } from './jobs/CobrancaScheduler';

// Exportações de Utils
export { BoletoPDFGenerator, DadosBoletoPDF } from './utils/BoletoPDFGenerator';

// Exportações de Config
export { databaseConfig, SCHEMA_SQL } from './config/database';

/**
 * Versão do módulo
 */
export const VERSION = '1.0.0';

/**
 * Inicialização do módulo
 */
export function initModuloCobranca(): void {
  console.log(`[ModuloCobrança] v${VERSION} inicializado`);
  console.log('[ModuloCobrança] Pronto para integração com Supabase');
}
