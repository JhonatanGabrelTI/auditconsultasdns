/**
 * Entidade: Boleto
 * Representa um título de cobrança
 */
export type StatusBoleto = 
  | '01' // A vencer
  | '61' // Pago
  | '04' // Protesto solicitado
  | '57' // Baixado
  | '05' // Cancelado
  | '62' // Pago parcial
  | '00'; // Pendente de registro

export interface Boleto {
  id: string;
  
  // Relacionamentos
  configuracaoId: string; // ID da configuração Bradesco
  clientePagadorId: string;
  
  // Identificação
  nossoNumero?: string; // 11 dígitos (gerado pelo Bradesco ou próprio)
  seuNumero: string; // Número de controle do cliente (max 25 caracteres)
  
  // Valores
  valor: number; // Valor nominal (2 decimais)
  valorAbatimento?: number;
  valorJuros?: number; // Calculado
  valorMulta?: number; // Calculado
  valorDesconto?: number;
  valorPago?: number; // Preenchido após liquidação
  
  // Datas
  dataEmissao: Date;
  dataVencimento: Date; // Deve ser >= dataEmissao
  dataLimiteDesconto1?: Date;
  dataLimiteDesconto2?: Date;
  dataLimiteDesconto3?: Date;
  dataPagamento?: Date; // Preenchido após liquidação
  
  // Configurações
  especieDocumento: '02' | '04' | '07' | '12' | '17' | '19' | '26' | '31';
  // 02=DM, 04=DS, 07=LC, 12=NP, 17=NS, 19=RC, 26=CC, 31=Cartão Crédito
  
  aceite: 'A' | 'N'; // A=Aceite, N=Não aceite
  
  // Instruções
  instrucoes?: string[]; // Até 9 linhas de instruções
  mensagens?: string[]; // Mensagens ao pagador
  
  // Juros e multa
  tipoJuros: '1' | '2'; // 1=Valor por dia, 2=Taxa mensal
  percentualJuros?: number;
  tipoMulta: '1' | '2'; // 1=Valor fixo, 2=Percentual
  percentualMulta?: number;
  
  // Descontos
  tipoDesconto?: '0' | '1' | '2'; // 0=Sem desconto, 1=Valor fixo, 2=Percentual
  
  // Protesto
  protestoAutomatico: boolean;
  diasProtesto?: number; // Mínimo 3 dias úteis após vencimento
  
  // Baixa/Devolução
  baixaDevolucaoAutomatica: boolean;
  diasBaixaDevolucao?: number; // Dias após vencimento para baixa
  
  // Retorno Bradesco (payload completo)
  payloadRegistro?: Record<string, any>; // Resposta da API de registro
  payloadConsulta?: Record<string, any>; // Resposta da última consulta
  
  // Dados do boleto gerado
  linhaDigitavel?: string; // 54 posições
  codigoBarras?: string; // 44 posições
  urlPdf?: string; // Link para PDF gerado
  
  // Status e controle
  status: StatusBoleto;
  situacaoPagamento?: '00' | '01' | '02'; // 00=Pagamento parcial, 01=Pago, 02=Pago mais
  
  // Flags de processamento
  registrado: boolean; // Já foi enviado para o Bradesco?
  notificadoVencimento: boolean;
  notificadoAtraso: boolean;
  protestoSolicitado: boolean;
  baixado: boolean;
  
  // Pagamento parcial
  permitePagamentoParcial: boolean;
  quantidadePagamentosParciais?: number;
  
  // Split de crédito (rateio)
  splitCredito?: {
    beneficiarios: Array<{
      cpfCnpj: string;
      nome: string;
      valor: number;
      percentual: number;
    }>;
  };
  
  // Auditoria
  createdAt: Date;
  updatedAt: Date;
  emitidoPor: string; // ID do usuário
}
