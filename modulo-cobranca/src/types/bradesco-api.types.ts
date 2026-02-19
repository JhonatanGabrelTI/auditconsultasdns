/**
 * Tipos para integração com API Bradesco (v1.7.1)
 * Baseado na documentação oficial
 */

// ==================== AUTENTICAÇÃO ====================
export interface BradescoAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// ==================== REGISTRO DE COBRANÇA ====================
export interface BradescoRegistroRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
    carteira: string;
    negociacao: string;
  };
  pagador: {
    cpfCnpj: string;
    nome: string;
    endereco: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
    };
    telefone?: string;
    email?: string;
  };
  titulo: {
    nossoNumero?: string;
    seuNumero: string;
    especie: '02' | '04' | '07' | '12' | '17' | '19' | '26' | '31';
    dataEmissao: string;
    dataVencimento: string;
    valorNominal: number;
    valorAbatimento?: number;
    tipoProtesto?: '0' | '1' | '2' | '3';
    diasProtesto?: number;
    tipoBaixa?: '0' | '1' | '2';
    diasBaixa?: number;
    tipoJuros: '1' | '2';
    juros?: number;
    tipoMulta: '1' | '2';
    multa?: number;
    tipoDesconto?: '0' | '1' | '2';
    valorDesconto1?: number;
    dataLimiteDesconto1?: string;
    valorDesconto2?: number;
    dataLimiteDesconto2?: string;
    valorDesconto3?: number;
    dataLimiteDesconto3?: string;
    aceite: 'A' | 'N';
    instrucoes?: string[];
    mensagens?: string[];
    cdPagamentoParcial?: 'S' | 'N';
    quantidadePagamentosParciais?: number;
  };
  split?: {
    beneficiarios: Array<{
      cpfCnpj: string;
      nome: string;
      valor: number;
    }>;
  };
}

export interface BradescoRegistroResponse {
  codigo: string;
  mensagem: string;
  dadosTitulo?: {
    nossoNumero: string;
    seuNumero: string;
    codigoBarras: string;
    linhaDigitavel: string;
    dataVencimento: string;
    valorNominal: number;
  };
  erros?: Array<{
    codigo: string;
    mensagem: string;
    campo?: string;
  }>;
}

// ==================== CONSULTA DE TÍTULO ====================
export interface BradescoConsultaRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
  };
  nossoNumero: string;
}

export interface BradescoConsultaResponse {
  codigo: string;
  mensagem: string;
  dadosTitulo?: {
    nossoNumero: string;
    seuNumero: string;
    situacao: string;
    dataSituacao: string;
    dataVencimento: string;
    valorNominal: number;
    valorPago?: number;
    dataPagamento?: string;
    valorJuros?: number;
    valorMulta?: number;
    valorDesconto?: number;
    cdPagamentoParcial?: string;
  };
}

// ==================== LISTA DE COBRANÇAS ====================
export interface BradescoListaRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
  };
  dataInicio: string;
  dataFim: string;
  situacao?: string;
  indMaisPagina?: 'S' | 'N';
  idUltimoRegistro?: string;
}

export interface BradescoListaResponse {
  codigo: string;
  mensagem: string;
  indMaisPagina: 'S' | 'N';
  titulos?: Array<{
    nossoNumero: string;
    seuNumero: string;
    situacao: string;
    dataSituacao: string;
    dataVencimento: string;
    valorNominal: number;
    valorPago?: number;
    dataPagamento?: string;
  }>;
}

// ==================== PENDENTES ====================
export interface BradescoPendentesRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
  };
  indMaisPagina?: 'S' | 'N';
  idUltimoRegistro?: string;
}

export interface BradescoPendentesResponse {
  codigo: string;
  mensagem: string;
  indMaisPagina: 'S' | 'N';
  titulos?: Array<{
    nossoNumero: string;
    seuNumero: string;
    dataVencimento: string;
    valorNominal: number;
    situacao: string;
  }>;
}

// ==================== BAIXA/CANCELAMENTO ====================
export interface BradescoBaixaRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
  };
  nossoNumero: string;
  motivoBaixa: '1' | '2' | '3' | '4' | '5' | '6' | '7';
}

export interface BradescoBaixaResponse {
  codigo: string;
  mensagem: string;
  nossoNumero?: string;
}

// ==================== PROTESTO/NEGATIVAÇÃO ====================
export interface BradescoProtestoRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
  };
  nossoNumero: string;
  codigoFuncao: '1' | '2' | '3' | '4';
}

export interface BradescoProtestoResponse {
  codigo: string;
  mensagem: string;
  nossoNumero?: string;
}

// ==================== ALTERAÇÃO ====================
export interface BradescoAlteracaoRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
  };
  nossoNumero: string;
  camposAlterar: {
    dataVencimento?: string;
    valorNominal?: number;
    valorAbatimento?: number;
    tipoJuros?: '1' | '2';
    juros?: number;
    tipoMulta?: '1' | '2';
    multa?: number;
  };
}

export interface BradescoAlteracaoResponse {
  codigo: string;
  mensagem: string;
  nossoNumero?: string;
}

// ==================== SPLIT/Rateio ====================
export interface BradescoSplitRequest {
  beneficiario: {
    cpfCnpj: string;
    agencia: string;
    conta: string;
  };
  nossoNumero: string;
  beneficiarios: Array<{
    cpfCnpj: string;
    nome: string;
    valor: number;
  }>;
}

export interface BradescoSplitResponse {
  codigo: string;
  mensagem: string;
  nossoNumero?: string;
}

// ==================== ERROS COMUNS ====================
export interface BradescoErrorResponse {
  codigo: string;
  mensagem: string;
  erros?: Array<{
    codigo: string;
    mensagem: string;
    campo?: string;
  }>;
}

// Mapeamento de códigos de erro
export const ERROS_BRADESCO: Record<string, string> = {
  'CBTT069': 'Registro duplicado - título já existe',
  'CBTT0552': 'Título não encontrado',
  'CBTT0987': 'Prazo para protesto inválido',
  'CBTT001': 'Beneficiário não cadastrado',
  'CBTT002': 'Agência/conta inválida',
  'CBTT003': 'Carteira inválida',
  'CBTT004': 'CNPJ/CPF do beneficiário inválido',
  'CBTT005': 'CNPJ/CPF do pagador inválido',
  'CBTT006': 'Endereço do pagador incompleto',
  'CBTT007': 'Data de vencimento inválida',
  'CBTT008': 'Valor do título inválido',
  'CBTT009': 'Espécie de documento inválida',
  'CBTT010': 'Nosso número inválido',
  'CBTT011': 'Seu número inválido',
};
