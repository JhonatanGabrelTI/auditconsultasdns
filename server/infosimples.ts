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

export const getIsDev = () => {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  return env === "development" || env === "";
};

// --- REMOVED MOCK FUNCTIONS PER USER REQUEST ---

export interface CNDFederalResponse {
  code: number;
  code_message: string;
  site_receipts?: string[];
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
  site_receipts?: string[];
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
  site_receipts?: string[];
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
  let clean = cnpj.replace(/[^\d]+/g, "");
  if (clean.length === 13) clean = "0" + clean;
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
  const clean = dateStr.trim();
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})/;
  const match = clean.match(regex);
  if (match) {
    const [_, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    return isNaN(date.getTime()) ? undefined : date;
  }
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
  certificado?: string,
  senha?: string
): Promise<CNDFederalResponse> {
  const token = getApiToken();
  const documentoLimpo = documento.replace(/\D/g, "");

  if (!token) {
    console.error("[InfoSimples] Critical Error: API token not configured.");
    throw new Error("Erro: Token da API InfoSimples não configurado no servidor.");
  }

  const isCPF = documentoLimpo.length === 11;
  if (isCPF && !dataNascimento) {
    throw new Error("Data de nascimento é obrigatória para consulta com CPF");
  }

  try {
    const payload: any = {
      token: token,
      origem: "web",
    };

    if (isCPF) {
      payload.cpf = documentoLimpo;
      payload.birthdate = dataNascimento;
    } else {
      payload.cnpj = documentoLimpo;
      payload.preferencia_emissao = preferenciaEmissao;
    }

    if (certificado) {
      payload.pkcs12 = certificado;
      payload.pkcs12_password = senha;
    }

    const response = await axios.post(
      `${getBaseUrl()}/receita-federal/pgfn/nova`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    console.log(`[InfoSimples] API Federal Response Code: ${response.data.code}`);
    return response.data;
  } catch (error: any) {
    console.error("[InfoSimples] Erro na consulta Federal real:", error.message);
    throw new Error(`Falha na API Real InfoSimples (Federal): ${error.message}`);
  }
}

export async function consultarCNDEstadual(
  inscricaoEstadual?: string,
  uf: string = "PR",
  cnpj?: string,
  certificado?: string,
  senha?: string
): Promise<CNDEstadualResponse> {
  const token = getApiToken();
  if (!token) throw new Error("Token InfoSimples não configurado");

  try {
    const payload: any = {
      token: token,
      origem: "web"
    };

    if (inscricaoEstadual && inscricaoEstadual.trim() !== "") {
      payload.ie = inscricaoEstadual.replace(/\D/g, "");
    }

    if (cnpj) {
      payload.cnpj = cnpj.replace(/\D/g, "");
    }

    if (certificado) {
      payload.pkcs12 = certificado;
      payload.pkcs12_password = senha;
    }

    // O usuário reportou que sefaz/pr é o endpoint correto agora
    const statePath = uf.toLowerCase() === "pr" ? "sefaz/pr" : `sefaz/${uf.toLowerCase()}/certidao-negativa`;

    console.log(`[InfoSimples] Enviando requisição Estadual real para ${inscricaoEstadual || cnpj} (${uf})...`);
    const response = await axios.post(
      `${getBaseUrl()}/${statePath}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      }
    );

    console.log(`[InfoSimples] API Estadual Response Code: ${response.data.code}`);
    return response.data;
  } catch (error: any) {
    console.error(`[InfoSimples] Erro na consulta Estadual (${uf}):`, error.message);
    throw new Error(`Erro na API Real InfoSimples (Estadual): ${error.message}`);
  }
}

export async function consultarRegularidadeFGTS(
  cnpj: string,
  certificado?: string,
  senha?: string
): Promise<RegularidadeFGTSResponse> {
  const token = getApiToken();
  if (!token) throw new Error("Token InfoSimples não configurado");

  try {
    const payload: any = {
      token: token,
      cnpj: cnpj.replace(/\D/g, ""),
      origem: "web"
    };

    if (certificado) {
      payload.pkcs12 = certificado;
      payload.pkcs12_password = senha;
    }

    console.log(`[InfoSimples] Enviando requisição FGTS real para ${cnpj}...`);
    const response = await axios.post(
      `${getBaseUrl()}/caixa/regularidade`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      }
    );

    console.log(`[InfoSimples] API FGTS Response Code: ${response.data.code}`);
    return response.data;
  } catch (error: any) {
    console.error("[InfoSimples] Erro na consulta FGTS real:", error.message);
    throw new Error(`Erro na API Real InfoSimples (FGTS): ${error.message}`);
  }
}

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

export async function consultarCaixaPostalECAC(
  cnpj: string,
  certificado?: string,
  senha?: string
): Promise<CaixaPostalECACResponse> {
  const token = getApiToken();
  if (!token) throw new Error("Token InfoSimples não configurado");

  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) throw new Error("CNPJ inválido (14 dígitos necessários)");

  try {
    const payload: any = {
      token: token,
      cnpj: cnpjLimpo,
    };

    if (certificado) {
      payload.pkcs12 = certificado;
      payload.pkcs12_password = senha;
    }

    console.log(`[InfoSimples] Enviando requisição real e-CAC para ${cnpjLimpo}...`);
    const response = await axios.post(
      `${getBaseUrl()}/ecac/caixa-postal`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    console.log(`[InfoSimples] API e-CAC Response Code: ${response.data.code}`);
    return response.data;
  } catch (error: any) {
    console.error("[InfoSimples] Erro na consulta e-CAC real:", error.message);
    throw new Error(`Erro na API Real InfoSimples (e-CAC): ${error.message}`);
  }
}

export function isInfoSimplesConfigured(): boolean {
  return !!getApiToken();
}
