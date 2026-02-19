/**
 * Entidade: WebhookRecebido
 * Log de notificações recebidas do Bradesco
 */
export type TipoEventoWebhook = 
  | 'LIQUIDACAO' // Boleto pago
  | 'BAIXA' // Boleto baixado
  | 'PROTESTO' // Protesto solicitado
  | 'ALTERACAO' // Alteração no título
  | 'REJEICAO'; // Rejeição de comando

export interface WebhookRecebido {
  id: string;
  
  // Identificação do evento
  tipoEvento: TipoEventoWebhook;
  
  // Dados do boleto (quando aplicável)
  nossoNumero?: string;
  seuNumero?: string;
  
  // Payload completo recebido
  payload: Record<string, any>;
  
  // Valores (para liquidações)
  valorPago?: number;
  dataPagamento?: Date;
  dataCredito?: Date;
  
  // Processamento
  processado: boolean;
  processadoEm?: Date;
  erroProcessamento?: string;
  
  // Retorno HTTP (para debugging)
  httpStatusRetornado: number;
  
  // Identificação da requisição
  ipOrigem?: string;
  headers?: Record<string, string>;
  
  // Auditoria
  recebidoEm: Date;
}
