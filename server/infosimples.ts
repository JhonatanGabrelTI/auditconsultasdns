import axios from "axios";

const INFOSIMPLES_API_TOKEN = process.env.INFOSIMPLES_API_TOKEN;
const BASE_URL = "https://api.infosimples.com/api/v2/consultas";

if (!INFOSIMPLES_API_TOKEN) {
  console.warn("[InfoSimples] API token not configured");
}

export interface CNDFederalResponse {
  code: number;
  code_message: string;
  data?: {
    situacao?: string;
    cnpj?: string;
    razao_social?: string;
    numero_certidao?: string;
    data_emissao?: string;
    data_validade?: string;
    validade_fim_data?: string;
    site_receipt?: string;
  };
}

export interface CNDEstadualResponse {
  code: number;
  code_message: string;
  data?: {
    situacao?: string;
    inscricao_estadual?: string;
    razao_social?: string;
    numero_certidao?: string;
    data_emissao?: string;
    data_validade?: string;
    validade_fim_data?: string;
    site_receipt?: string;
  };
}

export interface RegularidadeFGTSResponse {
  code: number;
  code_message: string;
  data?: {
    situacao?: string;
    cnpj?: string;
    razao_social?: string;
    numero_crf?: string;
    data_emissao?: string;
    data_validade?: string;
    validade_fim_data?: string;
    site_receipt?: string;
  };
}

/**
 * Consulta CND Federal (PGFN) via InfoSimples
 * Suporta CNPJ ou CPF (com data de nascimento)
 */
export async function consultarCNDFederal(
  documento: string,
  dataNascimento?: string,
  preferenciaEmissao: "nova" | "2via" = "nova"
): Promise<CNDFederalResponse> {
  if (!INFOSIMPLES_API_TOKEN) {
    throw new Error("InfoSimples API token not configured");
  }

  const documentoLimpo = documento.replace(/\D/g, "");
  const isCPF = documentoLimpo.length === 11;

  if (isCPF && !dataNascimento) {
    throw new Error("Data de nascimento é obrigatória para consulta com CPF");
  }

  try {
    const payload: any = {
      token: INFOSIMPLES_API_TOKEN,
      preferencia_emissao: preferenciaEmissao,
    };

    if (isCPF) {
      payload.cpf = documentoLimpo;
      payload.birthdate = dataNascimento; // formato: aaaa-mm-dd
    } else {
      payload.cnpj = documentoLimpo;
    }

    const response = await axios.post(
      `${BASE_URL}/receita-federal/pgfn/nova`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[InfoSimples] Erro ao consultar CND Federal:", error.message);
    throw new Error(`Erro ao consultar CND Federal: ${error.message}`);
  }
}

/**
 * Consulta CND Estadual PR (SEFAZ) via InfoSimples
 */
export async function consultarCNDEstadual(
  inscricaoEstadual: string,
  cnpj?: string
): Promise<CNDEstadualResponse> {
  if (!INFOSIMPLES_API_TOKEN) {
    throw new Error("InfoSimples API token not configured");
  }

  try {
    const payload: any = {
      token: INFOSIMPLES_API_TOKEN,
      ie: inscricaoEstadual,
    };

    if (cnpj) {
      payload.cnpj = cnpj.replace(/\D/g, "");
    }

    const response = await axios.post(
      `${BASE_URL}/sefaz/pr`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[InfoSimples] Erro ao consultar CND Estadual:", error.message);
    throw new Error(`Erro ao consultar CND Estadual: ${error.message}`);
  }
}

/**
 * Consulta Regularidade FGTS (Caixa) via InfoSimples
 */
export async function consultarRegularidadeFGTS(cnpj: string): Promise<RegularidadeFGTSResponse> {
  if (!INFOSIMPLES_API_TOKEN) {
    throw new Error("InfoSimples API token not configured");
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/caixa/regularidade`,
      {
        cnpj: cnpj.replace(/\D/g, ""),
        token: INFOSIMPLES_API_TOKEN,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[InfoSimples] Erro ao consultar Regularidade FGTS:", error.message);
    throw new Error(`Erro ao consultar Regularidade FGTS: ${error.message}`);
  }
}

/**
 * Interface para resposta da Caixa Postal e-CAC
 */
export interface CaixaPostalECACResponse {
  code: number;
  code_message: string;
  data?: {
    situacao?: string;
    cnpj?: string;
    razao_social?: string;
    total_mensagens?: number;
    mensagens_nao_lidas?: number;
    mensagens?: Array<{
      id?: string;
      tipo?: string;
      titulo?: string;
      conteudo?: string;
      data_envio?: string;
      data_recebimento?: string;
      lida?: boolean;
      prioridade?: string;
    }>;
  };
}

/**
 * Consulta Caixa Postal e-CAC (DTE - Documentos e Tarefas Eletrônicas) via InfoSimples
 * Retorna mensagens, intimações, autos de infração e avisos da caixa postal
 */
export async function consultarCaixaPostalECAC(
  cnpj: string,
  certificado?: string,
  senha?: string
): Promise<CaixaPostalECACResponse> {
  if (!INFOSIMPLES_API_TOKEN) {
    throw new Error("InfoSimples API token not configured");
  }

  const cnpjLimpo = cnpj.replace(/\D/g, "");

  if (cnpjLimpo.length !== 14) {
    throw new Error("CNPJ inválido. Deve conter 14 dígitos.");
  }

  try {
    const payload: any = {
      token: INFOSIMPLES_API_TOKEN,
      cnpj: cnpjLimpo,
    };

    // Se tiver certificado digital para acesso ao e-CAC
    if (certificado) {
      payload.certificado = certificado;
    }
    if (senha) {
      payload.senha = senha;
    }

    const response = await axios.post(
      `${BASE_URL}/ecac/caixa-postal`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000, // Timeout maior pois a consulta pode demorar
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[InfoSimples] Erro ao consultar Caixa Postal e-CAC:", error.message);
    throw new Error(`Erro ao consultar Caixa Postal e-CAC: ${error.message}`);
  }
}

/**
 * Valida se o token está configurado corretamente
 */
export function isInfoSimplesConfigured(): boolean {
  return !!INFOSIMPLES_API_TOKEN;
}
