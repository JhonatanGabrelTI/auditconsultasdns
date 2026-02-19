/**
 * Entidade: LoteProcessamento
 * Controle de processamento em lote de boletos
 */
export type StatusLote = 
  | 'pendente'
  | 'processando'
  | 'concluido'
  | 'concluido_com_erros'
  | 'cancelado';

export interface ErroProcessamento {
  linha: number;
  boletoId?: string;
  erro: string;
  codigoErro?: string;
  payload?: Record<string, any>;
}

export interface LoteProcessamento {
  id: string;
  
  // Configuração
  configuracaoId: string;
  nome: string; // Identificação do lote
  
  // Status
  status: StatusLote;
  
  // Contadores
  totalRegistros: number;
  processados: number;
  sucessos: number;
  erros: number;
  
  // Detalhes dos erros
  detalhesErros: ErroProcessamento[];
  
  // Controle de execução
  iniciadoEm?: Date;
  concluidoEm?: Date;
  
  // Rate limiting (controle de throttling)
  delayEntreChamadasMs: number; // Padrão: 1000ms (1 chamada por segundo)
  
  // Dados do arquivo (se importado via CSV/Excel)
  nomeArquivo?: string;
  tipoArquivo?: 'csv' | 'xlsx' | 'json';
  
  // Relacionamentos
  boletosIds: string[];
  
  // Auditoria
  createdAt: Date;
  criadoPor: string;
}
