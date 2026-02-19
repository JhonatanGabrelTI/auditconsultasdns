/**
 * Service: BradescoIntegrationService
 * Integração completa com API Bradesco (v1.7.1)
 * 
 * Funcionalidades:
 * - Autenticação OAuth2 com refresh automático
 * - Registro de cobrança (individual e lote)
 * - Consulta de títulos
 * - Lista de cobranças
 * - Baixa/cancelamento
 * - Protesto/negativação
 * - Alteração de títulos
 * - Split/Rateio de crédito
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  BradescoAuthResponse,
  BradescoRegistroRequest,
  BradescoRegistroResponse,
  BradescoConsultaRequest,
  BradescoConsultaResponse,
  BradescoListaRequest,
  BradescoListaResponse,
  BradescoPendentesRequest,
  BradescoPendentesResponse,
  BradescoBaixaRequest,
  BradescoBaixaResponse,
  BradescoProtestoRequest,
  BradescoProtestoResponse,
  BradescoAlteracaoRequest,
  BradescoAlteracaoResponse,
  BradescoSplitRequest,
  BradescoSplitResponse,
  ERROS_BRADESCO,
} from '../types/bradesco-api.types';
import { ConfiguracaoCobranca } from '../entities/ConfiguracaoCobranca';

export class BradescoIntegrationService {
  private httpClient: AxiosInstance;
  private config: ConfiguracaoCobranca;
  private baseURL: string;

  constructor(config: ConfiguracaoCobranca) {
    this.config = config;
    this.baseURL = config.ambiente === 'producao'
      ? 'https://api.bradesco.com.br/bradesco/v1'
      : 'https://homologacao.api.bradesco.com.br/bradesco/v1';

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token
    this.httpClient.interceptors.request.use(
      async (config) => {
        const token = await this.getValidAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para retry em caso de erro de autenticação
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest) {
          // Token expirado, renovar e retry
          await this.refreshAccessToken();
          const token = await this.getValidAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return this.httpClient(originalRequest);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ==================== AUTENTICAÇÃO ====================

  /**
   * Obtém token de acesso válido (renova se necessário)
   */
  private async getValidAccessToken(): Promise<string> {
    if (this.config.accessToken && this.config.tokenExpiresAt) {
      const expiresAt = new Date(this.config.tokenExpiresAt);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutos de margem
      
      if (expiresAt.getTime() - bufferTime > now.getTime()) {
        return this.config.accessToken;
      }
    }
    
    return this.refreshAccessToken();
  }

  /**
   * Renova o token de acesso OAuth2
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      const authUrl = this.config.ambiente === 'producao'
        ? 'https://oauth.bradesco.com.br/auth/server/v1.1/token'
        : 'https://homologacao.oauth.bradesco.com.br/auth/server/v1.1/token';

      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await axios.post<BradescoAuthResponse>(
        authUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, expires_in } = response.data;
      
      // Atualiza configuração
      this.config.accessToken = access_token;
      this.config.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      
      // Aqui você deve persistir no banco
      // await this.atualizarConfiguracao();
      
      return access_token;
    } catch (error) {
      console.error('[Bradesco] Erro ao renovar token:', error);
      throw new Error('Falha na autenticação com o Bradesco');
    }
  }

  // ==================== REGISTRO DE COBRANÇA ====================

  /**
   * Registra um título de cobrança no Bradesco
   */
  async registrarBoleto(dados: BradescoRegistroRequest): Promise<BradescoRegistroResponse> {
    try {
      const response = await this.httpClient.post<BradescoRegistroResponse>(
        '/boleto/cobranca-registro/v1/cobranca',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoRegistroResponse>(error);
    }
  }

  /**
   * Registra múltiplos boletos em lote
   */
  async registrarLote(
    boletos: BradescoRegistroRequest[],
    delayMs: number = 1000
  ): Promise<Array<{ sucesso: boolean; dados?: BradescoRegistroResponse; erro?: string }>> {
    const resultados = [];
    
    for (const boleto of boletos) {
      try {
        const resultado = await this.registrarBoleto(boleto);
        resultados.push({ sucesso: true, dados: resultado });
      } catch (error: any) {
        resultados.push({ sucesso: false, erro: error.message });
      }
      
      // Delay para respeitar rate limit
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return resultados;
  }

  // ==================== CONSULTAS ====================

  /**
   * Consulta um título específico
   */
  async consultarBoleto(dados: BradescoConsultaRequest): Promise<BradescoConsultaResponse> {
    try {
      const response = await this.httpClient.post<BradescoConsultaResponse>(
        '/boleto/cobranca-consulta/v1/consultar',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoConsultaResponse>(error);
    }
  }

  /**
   * Lista títulos liquidados em um período (conciliação)
   */
  async listarCobrancas(dados: BradescoListaRequest): Promise<BradescoListaResponse> {
    try {
      const response = await this.httpClient.post<BradescoListaResponse>(
        '/boleto/cobranca-lista/v1/listar',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoListaResponse>(error);
    }
  }

  /**
   * Lista títulos pendentes (para cobrança ativa)
   */
  async listarPendentes(dados: BradescoPendentesRequest): Promise<BradescoPendentesResponse> {
    try {
      const response = await this.httpClient.post<BradescoPendentesResponse>(
        '/boleto/cobranca-pendente/v1/listar',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoPendentesResponse>(error);
    }
  }

  // ==================== BAIXA/CANCELAMENTO ====================

  /**
   * Baixa/cancela um título
   */
  async baixarBoleto(dados: BradescoBaixaRequest): Promise<BradescoBaixaResponse> {
    try {
      const response = await this.httpClient.post<BradescoBaixaResponse>(
        '/boleto/cobranca-baixa/v1/baixar',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoBaixaResponse>(error);
    }
  }

  // ==================== PROTESTO/NEGATIVAÇÃO ====================

  /**
   * Solicita protesto ou negativação
   */
  async executarProtesto(dados: BradescoProtestoRequest): Promise<BradescoProtestoResponse> {
    try {
      const response = await this.httpClient.post<BradescoProtestoResponse>(
        '/boleto/cobranca-protesto-negativacao/v1/executar',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoProtestoResponse>(error);
    }
  }

  // ==================== ALTERAÇÃO ====================

  /**
   * Altera dados de um título (antes do vencimento)
   */
  async alterarBoleto(dados: BradescoAlteracaoRequest): Promise<BradescoAlteracaoResponse> {
    try {
      const response = await this.httpClient.put<BradescoAlteracaoResponse>(
        '/boleto/cobranca-altera/v1/alterar',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoAlteracaoResponse>(error);
    }
  }

  // ==================== SPLIT/Rateio ====================

  /**
   * Configura rateio de crédito (split)
   */
  async configurarSplit(dados: BradescoSplitRequest): Promise<BradescoSplitResponse> {
    try {
      const response = await this.httpClient.post<BradescoSplitResponse>(
        '/boleto/cobranca-manutencao-split/v1/manutencao-rateio-credito',
        dados
      );
      
      return response.data;
    } catch (error) {
      return this.handleError<BradescoSplitResponse>(error);
    }
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Trata erros da API e retorna mensagem amigável
   */
  private handleError<T>(error: any): T {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const data = axiosError.response?.data as any;
      
      if (data?.codigo) {
        const mensagemAmigavel = ERROS_BRADESCO[data.codigo] || data.mensagem;
        throw new Error(`[${data.codigo}] ${mensagemAmigavel}`);
      }
      
      if (data?.erros && Array.isArray(data.erros)) {
        const erros = data.erros.map((e: any) => `[${e.codigo}] ${e.mensagem}`).join(', ');
        throw new Error(`Erros: ${erros}`);
      }
      
      throw new Error(`Erro na API Bradesco: ${axiosError.message}`);
    }
    
    throw error;
  }

  /**
   * Calcula fator de vencimento para código de barras
   */
  calcularFatorVencimento(dataVencimento: Date): number {
    const dataBase = new Date('1997-10-07');
    const diffTime = dataVencimento.getTime() - dataBase.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Calcula dígito verificador do código de barras
   */
  calcularDigitoVerificador44(codigo: string): number {
    // Cálculo módulo 11 com pesos 2 a 9 (da direita para esquerda)
    const pesos = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    let posicao = 0;
    
    for (let i = codigo.length - 1; i >= 0; i--) {
      soma += parseInt(codigo[i]) * pesos[posicao % pesos.length];
      posicao++;
    }
    
    const resto = soma % 11;
    const digito = 11 - resto;
    
    if (digito === 0 || digito === 1 || digito > 9) {
      return 1;
    }
    
    return digito;
  }
}
