/**
 * Entidade: ConfiguracaoCobranca
 * Armazena credenciais e regras de negócio do Bradesco
 */
export interface ConfiguracaoCobranca {
  id: string;
  
  // Dados do beneficiário (cedente)
  cpfCnpjBeneficiario: string; // CPF/CNPJ do beneficiário (sem máscara)
  nomeBeneficiario: string;
  agencia: string; // 4 dígitos
  conta: string; // 7 dígitos
  carteira: string; // Código da carteira (ex: 09, 26)
  negociacao: string; // Código da negociação/contrato
  
  // Configurações OAuth2 Bradesco
  clientId: string;
  clientSecret: string; // Criptografado
  accessToken?: string; // Temporário
  refreshToken?: string;
  tokenExpiresAt?: Date;
  
  // Regras de negócio
  prazoProtestoDias: number; // Mínimo 3 dias úteis
  percentualJurosDia: number; // % ao dia (ex: 0.0333)
  percentualMulta: number; // % sobre valor (ex: 2.0)
  
  // Descontos (até 3 níveis)
  desconto1?: {
    dias: number;
    percentual: number;
  };
  desconto2?: {
    dias: number;
    percentual: number;
  };
  desconto3?: {
    dias: number;
    percentual: number;
  };
  
  // Configurações de notificação
  emailRemetente?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
  whatsappApiKey?: string; // Twilio ou similar
  
  // Flags
  ativo: boolean;
  ambiente: 'producao' | 'homologacao';
  
  // Auditoria
  createdAt: Date;
  updatedAt: Date;
  criadoPor: string; // ID do usuário
}
