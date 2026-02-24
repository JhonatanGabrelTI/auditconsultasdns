import axios from "axios";

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env is loaded synchronously from project root
const rootEnvPath = path.resolve(__dirname, "../.env");
config({ path: rootEnvPath });

const getApiToken = () => {
  let token = process.env.INFOSIMPLES_API_TOKEN;
  if (!token) {
    // Try to reload synchronously as a last resort
    try {
      const dotenv = require("dotenv");
      dotenv.config({ path: rootEnvPath });
      token = process.env.INFOSIMPLES_API_TOKEN;
    } catch (e) {
      console.error("[InfoSimples] Failed to reload .env synchronously", e);
    }
  }
  return token;
};
const getBaseUrl = () => process.env.INFOSIMPLES_BASE_URL || "https://api.infosimples.com/api/v2/consultas";
const getIsDev = () => {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  return env === "development" || env === "";
};

function getMockCNDFederal(documento: string): CNDFederalResponse {
  return {
    code: 200,
    code_message: "Consulta realizada com sucesso (MOCK)",
    data: {
      situacao: "REGULAR",
      cnpj: documento,
      razao_social: "EMPRESA DE TESTE LTDA",
      numero_certidao: "2024.000123456-78",
      data_emissao: new Date().toISOString(),
      data_validade: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      validade_fim_data: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      site_receipt: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
  };
}

function getMockCNDEstadual(ie: string): CNDEstadualResponse {
  return {
    code: 200,
    code_message: "Consulta realizada com sucesso (MOCK)",
    data: {
      situacao: "SEM PENDÊNCIAS",
      inscricao_estadual: ie,
      razao_social: "EMPRESA ESTADUAL LTDA",
      numero_certidao: "IE-PR-999888/2024",
      data_emissao: new Date().toISOString(),
      data_validade: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      site_receipt: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
  };
}

function getMockFGTS(cnpj: string): RegularidadeFGTSResponse {
  return {
    code: 200,
    code_message: "Consulta realizada com sucesso (MOCK)",
    data: {
      situacao: "REGULAR",
      cnpj: cnpj,
      razao_social: "EMPRESA FGTS TESTE",
      numero_crf: "202402240123456789",
      data_emissao: new Date().toISOString(),
      data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      validade_fim_data: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      site_receipt: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
  };
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
 * Valida Checksum de CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/[^\d]+/g, "");
  if (clean.length !== 14 || /^(\d)\1+$/.test(clean)) return false;
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  let digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === Number(digits.charAt(1));
}

/**
 * Converte data brasileira (DD/MM/YYYY) para objeto Date
 */
export function parseBrazilianDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;

  // Limpa possíveis espaços ou caracteres extras
  const clean = dateStr.trim();

  // Formato DD/MM/YYYY
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})/;
  const match = clean.match(regex);

  if (match) {
    const [_, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    return isNaN(date.getTime()) ? undefined : date;
  }

  // Tenta ISO como fallback
  const iso = new Date(clean);
  return isNaN(iso.getTime()) ? undefined : iso;
}

export function isProbablyTestData(documento: string): boolean {
  const clean = documento.replace(/\D/g, "");
  if (clean.length < 11) return true;
  if (/^(\d)\1+$/.test(clean)) return true;
  if (clean.length === 14 && !isValidCNPJ(clean)) return true;
  return false;
}

/**
 * Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 */
function formatarCnpj(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export async function consultarCNDFederal(
  documento: string,
  dataNascimento?: string,
  preferenciaEmissao: "nova" | "2via" = "nova",
  certificado?: string, // base64
  senha?: string
): Promise<CNDFederalResponse> {
  const isDev = getIsDev();
  const token = getApiToken();
  const documentoLimpo = documento.replace(/\D/g, "");

  // Se estiver em Dev e os dados parecem de teste (ou token faltando), usa Mock logo de cara
  if (isDev && (!token || isProbablyTestData(documentoLimpo))) {
    console.log("[InfoSimples] Usando Mock em Dev (documento de teste ou sem token).");
    return getMockCNDFederal(documento);
  }

  if (!token) {
    throw new Error("InfoSimples API token not configured");
  }

  const isCPF = documentoLimpo.length === 11;
  if (isCPF && !dataNascimento) {
    throw new Error("Data de nascimento é obrigatória para consulta com CPF");
  }

  try {
    const params: any = {
      token: token,
      origem: "web",
    };

    const payload: any = {};

    if (isCPF) {
      params.cpf = documentoLimpo;
      params.birthdate = dataNascimento;
    } else {
      params.cnpj = formatarCnpj(documentoLimpo);
      params.preferencia_emissao = preferenciaEmissao;
    }

    if (certificado) {
      payload.pkcs12 = certificado;
      payload.pkcs12_password = senha;
    }

    const queryString = new URLSearchParams(params).toString();

    const response = await axios.post(
      `${getBaseUrl()}/receita-federal/pgfn/nova?${queryString}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    // Desativamos o fallback automático se houver um token, 
    // para que o usuário veja o erro real da InfoSimples
    if (isDev && !token && response.data.code !== 200) {
      if (response.data.code === 400 || response.data.code === 404 || response.data.code === 408) {
        console.warn("[InfoSimples] API real retornou erro em Dev, enviando mock:", response.data.code_message);
        return getMockCNDFederal(documento);
      }
    }

    return response.data;
  } catch (error: any) {
    if (isDev && !token) {
      console.warn("[InfoSimples] Erro na API Real em Dev (sem token), usando Mock:", error.message);
      return getMockCNDFederal(documento);
    }
    console.error("[InfoSimples] Erro ao consultar CND Federal:", error.message);
    throw new Error(`Erro ao consultar CND Federal: ${error.message}`);
  }
}

/**
 * Consulta CND Estadual PR (SEFAZ) via InfoSimples
 */
export async function consultarCNDEstadual(
  inscricaoEstadual: string,
  uf: string = "PR", // Default PR se não informado
  cnpj?: string,
  certificado?: string,
  senha?: string
): Promise<CNDEstadualResponse> {
  const isDev = getIsDev();
  const token = getApiToken();

  // Em Dev, se não houver token ou a IE parecer falsa, usa Mock
  if (isDev && (!token || isProbablyTestData(inscricaoEstadual))) {
    return getMockCNDEstadual(inscricaoEstadual);
  }

  if (!token) {
    throw new Error("InfoSimples API token not configured");
  }

  try {
    const payload: any = {
      ie: inscricaoEstadual,
      origem: "web"
    };

    if (certificado) {
      payload.pkcs12 = certificado;
      payload.pkcs12_password = senha;
    }

    if (cnpj) {
      payload.cnpj = formatarCnpj(cnpj);
    }

    // Tentar usar o endpoint unificado se a UF estiver presente, senão mantém fallback PR
    const statePath = uf.toLowerCase() === "pr" ? "sefaz/pr/certidao-debitos" : `sefaz/${uf.toLowerCase()}/certidao-negativa`;

    const response = await axios.post(
      `${getBaseUrl()}/${statePath}?token=${token}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      }
    );

    if (isDev && !token && response.data.code !== 200) {
      console.warn("[InfoSimples] API Estadual erro em Dev, enviando Mock.");
      return getMockCNDEstadual(inscricaoEstadual);
    }

    return response.data;
  } catch (error: any) {
    if (isDev && !token) {
      console.warn("[InfoSimples] Erro API Estadual em Dev (sem token), usando Mock:", error.message);
      return getMockCNDEstadual(inscricaoEstadual);
    }
    console.error(`[InfoSimples] Erro ao consultar CND Estadual (${uf}):`, error.message);
    throw new Error(`Erro ao consultar CND Estadual (${uf}): ${error.message}`);
  }
}

/**
 * Consulta Regularidade FGTS (Caixa) via InfoSimples
 */
export async function consultarRegularidadeFGTS(
  cnpj: string,
  certificado?: string,
  senha?: string
): Promise<RegularidadeFGTSResponse> {
  const isDev = getIsDev();
  const token = getApiToken();

  if (isDev && (!token || isProbablyTestData(cnpj))) {
    return getMockFGTS(cnpj);
  }

  if (!token) {
    throw new Error("InfoSimples API token not configured");
  }

  try {
    const payload: any = {
      cnpj: formatarCnpj(cnpj),
      origem: "web"
    };

    if (certificado) {
      payload.pkcs12 = certificado;
      payload.pkcs12_password = senha;
    }

    const response = await axios.post(
      `${getBaseUrl()}/caixa/regularidade?token=${token}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      }
    );

    if (isDev && !token && response.data.code !== 200) {
      console.warn("[InfoSimples] API FGTS erro em Dev, enviando mock.");
      return getMockFGTS(cnpj);
    }

    return response.data;
  } catch (error: any) {
    if (isDev && !token) {
      console.warn("[InfoSimples] Erro API FGTS em Dev (sem token), usando Mock:", error.message);
      return getMockFGTS(cnpj);
    }
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
  if (!getApiToken()) {
    throw new Error("InfoSimples API token not configured");
  }

  const cnpjLimpo = cnpj.replace(/\D/g, "");

  if (cnpjLimpo.length !== 14) {
    throw new Error("CNPJ inválido. Deve conter 14 dígitos.");
  }

  try {
    const payload: any = {
      token: getApiToken(),
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
      `${getBaseUrl()}/ecac/caixa-postal`,
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
  return !!getApiToken();
}
