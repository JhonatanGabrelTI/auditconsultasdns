/**
 * Entidade: HistoricoStatus
 * Timeline de alterações de status dos boletos (Auditoria LGPD)
 */
export interface HistoricoStatus {
  id: string;
  
  // Relacionamento
  boletoId: string;
  
  // Dados da alteração
  statusAnterior?: string;
  statusNovo: string;
  
  // Tipo de alteração
  tipoAlteracao: 
    | 'REGISTRO' // Primeiro registro
    | 'LIQUIDACAO' // Pagamento
    | 'BAIXA' // Baixa/cancelamento
    | 'PROTESTO' // Protesto solicitado
    | 'ALTERACAO' // Alteração de dados
    | 'REPROCESSAMENTO' // Tentativa de reprocessamento
    | 'NOTIFICACAO'; // Envio de notificação
  
  // Dados adicionais (JSON)
  dadosAdicionais?: Record<string, any>;
  
  // Valores (se alterados)
  valorAnterior?: number;
  valorNovo?: number;
  
  // Origem da alteração
  origem: 'API' | 'WEBHOOK' | 'JOB' | 'MANUAL' | 'SISTEMA';
  
  // Usuário/sistema que realizou a alteração
  alteradoPor?: string; // ID do usuário ou "SISTEMA"
  
  // IP e dados da requisição (LGPD)
  ipOrigem?: string;
  userAgent?: string;
  
  // Timestamp
  createdAt: Date;
}
