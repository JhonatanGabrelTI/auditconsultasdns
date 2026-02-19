/**
 * Service: BoletoService
 * Camada de negócio para gestão de boletos
 * Orquestra integração com Bradesco e persistência
 */

import { Boleto, StatusBoleto } from '../entities/Boleto';
import { ClientePagador } from '../entities/ClientePagador';
import { ConfiguracaoCobranca } from '../entities/ConfiguracaoCobranca';
import { HistoricoStatus } from '../entities/HistoricoStatus';
import { BradescoIntegrationService } from './BradescoIntegrationService';
import { BradescoRegistroRequest } from '../types/bradesco-api.types';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface EmitirBoletoDTO {
  configuracaoId: string;
  clientePagadorId: string;
  seuNumero: string;
  valor: number;
  dataVencimento: Date;
  especieDocumento: '02' | '04' | '07' | '12' | '17' | '19' | '26' | '31';
  mensagens?: string[];
  instrucoes?: string[];
  permitePagamentoParcial?: boolean;
  protestoAutomatico?: boolean;
  diasProtesto?: number;
}

export interface ResultadoEmissao {
  sucesso: boolean;
  boleto?: Boleto;
  erro?: string;
  codigoErro?: string;
}

export class BoletoService {
  private bradescoService: BradescoIntegrationService;
  private config: ConfiguracaoCobranca;
  
  // Repositórios (simulados - devem ser injetados)
  private boletoRepo: any;
  private clienteRepo: any;
  private historicoRepo: any;

  constructor(
    config: ConfiguracaoCobranca,
    boletoRepo: any,
    clienteRepo: any,
    historicoRepo: any
  ) {
    this.config = config;
    this.bradescoService = new BradescoIntegrationService(config);
    this.boletoRepo = boletoRepo;
    this.clienteRepo = clienteRepo;
    this.historicoRepo = historicoRepo;
  }

  // ==================== EMISSÃO ====================

  /**
   * Emite um boleto individual
   */
  async emitirBoleto(dados: EmitirBoletoDTO, usuarioId: string): Promise<ResultadoEmissao> {
    try {
      // 1. Buscar cliente pagador
      const cliente = await this.clienteRepo.findById(dados.clientePagadorId);
      if (!cliente) {
        return { sucesso: false, erro: 'Cliente pagador não encontrado' };
      }

      // 2. Validar dados
      const validacao = this.validarDadosEmissao(dados, cliente);
      if (!validacao.valido) {
        return { sucesso: false, erro: validacao.erro };
      }

      // 3. Preparar payload para Bradesco
      const payload = this.montarPayloadRegistro(dados, cliente);

      // 4. Chamar API Bradesco
      const resposta = await this.bradescoService.registrarBoleto(payload);

      // 5. Verificar resposta
      if (resposta.codigo !== '200' && resposta.codigo !== '201') {
        return {
          sucesso: false,
          erro: resposta.mensagem,
          codigoErro: resposta.codigo,
        };
      }

      // 6. Criar entidade Boleto
      const boleto: Boleto = {
        id: this.gerarId(),
        configuracaoId: dados.configuracaoId,
        clientePagadorId: dados.clientePagadorId,
        seuNumero: dados.seuNumero,
        nossoNumero: resposta.dadosTitulo!.nossoNumero,
        valor: dados.valor,
        dataEmissao: new Date(),
        dataVencimento: dados.dataVencimento,
        especieDocumento: dados.especieDocumento,
        aceite: 'N',
        status: '00',
        linhaDigitavel: resposta.dadosTitulo!.linhaDigitavel,
        codigoBarras: resposta.dadosTitulo!.codigoBarras,
        payloadRegistro: resposta as any,
        registrado: true,
        protestoAutomatico: dados.protestoAutomatico || false,
        diasProtesto: dados.diasProtesto || this.config.prazoProtestoDias,
        permitePagamentoParcial: dados.permitePagamentoParcial || false,
        tipoJuros: '2', // Taxa mensal
        percentualJuros: this.config.percentualJurosDia,
        tipoMulta: '2', // Percentual
        percentualMulta: this.config.percentualMulta,
        notificadoVencimento: false,
        notificadoAtraso: false,
        protestoSolicitado: false,
        baixado: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        emitidoPor: usuarioId,
        instrucoes: dados.instrucoes,
        mensagens: dados.mensagens,
      };

      // 7. Salvar no banco
      await this.boletoRepo.save(boleto);

      // 8. Registrar histórico
      await this.registrarHistorico({
        boletoId: boleto.id,
        tipoAlteracao: 'REGISTRO',
        statusNovo: '00',
        origem: 'API',
        alteradoPor: usuarioId,
        dadosAdicionais: {
          nossoNumero: boleto.nossoNumero,
          linhaDigitavel: boleto.linhaDigitavel,
        },
      });

      return { sucesso: true, boleto };

    } catch (error: any) {
      console.error('[BoletoService] Erro ao emitir:', error);
      return { 
        sucesso: false, 
        erro: error.message || 'Erro interno ao emitir boleto' 
      };
    }
  }

  // ==================== CONSULTA E ATUALIZAÇÃO ====================

  /**
   * Consulta status atualizado no Bradesco e atualiza local
   */
  async consultarEAtualizar(boletoId: string): Promise<Boleto | null> {
    try {
      const boleto = await this.boletoRepo.findById(boletoId);
      if (!boleto || !boleto.nossoNumero) {
        throw new Error('Boleto não encontrado ou não registrado');
      }

      const resposta = await this.bradescoService.consultarBoleto({
        beneficiario: {
          cpfCnpj: this.config.cpfCnpjBeneficiario,
          agencia: this.config.agencia,
          conta: this.config.conta,
        },
        nossoNumero: boleto.nossoNumero,
      });

      if (resposta.codigo !== '200' || !resposta.dadosTitulo) {
        throw new Error(resposta.mensagem);
      }

      const dados = resposta.dadosTitulo;
      const statusAnterior = boleto.status;
      const statusNovo = dados.situacao as StatusBoleto;

      // Atualizar boleto
      const atualizacoes: Partial<Boleto> = {
        status: statusNovo,
        payloadConsulta: resposta as any,
        updatedAt: new Date(),
      };

      if (dados.valorPago) {
        atualizacoes.valorPago = dados.valorPago;
      }
      if (dados.dataPagamento) {
        atualizacoes.dataPagamento = new Date(dados.dataPagamento);
      }

      await this.boletoRepo.update(boletoId, atualizacoes);

      // Registrar histórico se mudou de status
      if (statusAnterior !== statusNovo) {
        await this.registrarHistorico({
          boletoId,
          tipoAlteracao: this.mapearTipoAlteracao(statusNovo),
          statusAnterior,
          statusNovo,
          origem: 'API',
          dadosAdicionais: {
            valorPago: dados.valorPago,
            dataPagamento: dados.dataPagamento,
          },
        });
      }

      return { ...boleto, ...atualizacoes };

    } catch (error) {
      console.error('[BoletoService] Erro ao consultar:', error);
      throw error;
    }
  }

  // ==================== BAIXA ====================

  /**
   * Solicita baixa/cancelamento de boleto
   */
  async baixarBoleto(boletoId: string, motivo: '1' | '2' | '3' | '4' | '5' | '6' | '7', usuarioId: string): Promise<void> {
    try {
      const boleto = await this.boletoRepo.findById(boletoId);
      if (!boleto || !boleto.nossoNumero) {
        throw new Error('Boleto não encontrado ou não registrado');
      }

      const resposta = await this.bradescoService.baixarBoleto({
        beneficiario: {
          cpfCnpj: this.config.cpfCnpjBeneficiario,
          agencia: this.config.agencia,
          conta: this.config.conta,
        },
        nossoNumero: boleto.nossoNumero,
        motivoBaixa: motivo,
      });

      if (resposta.codigo !== '200') {
        throw new Error(resposta.mensagem);
      }

      // Atualizar status
      await this.boletoRepo.update(boletoId, {
        status: '57',
        baixado: true,
        updatedAt: new Date(),
      });

      // Registrar histórico
      await this.registrarHistorico({
        boletoId,
        tipoAlteracao: 'BAIXA',
        statusAnterior: boleto.status,
        statusNovo: '57',
        origem: 'MANUAL',
        alteradoPor: usuarioId,
      });

    } catch (error) {
      console.error('[BoletoService] Erro ao baixar:', error);
      throw error;
    }
  }

  // ==================== PROTESTO ====================

  /**
   * Solicita protesto de boleto vencido
   */
  async protestarBoleto(boletoId: string, codigoFuncao: '1' | '3', usuarioId: string): Promise<void> {
    try {
      const boleto = await this.boletoRepo.findById(boletoId);
      if (!boleto || !boleto.nossoNumero) {
        throw new Error('Boleto não encontrado');
      }

      // Validar prazo
      const diasVencido = differenceInDays(new Date(), new Date(boleto.dataVencimento));
      if (diasVencido < 3) {
        throw new Error('Prazo mínimo de 3 dias úteis não atingido');
      }

      const resposta = await this.bradescoService.executarProtesto({
        beneficiario: {
          cpfCnpj: this.config.cpfCnpjBeneficiario,
          agencia: this.config.agencia,
          conta: this.config.conta,
        },
        nossoNumero: boleto.nossoNumero,
        codigoFuncao,
      });

      if (resposta.codigo !== '200') {
        throw new Error(resposta.mensagem);
      }

      // Atualizar status
      await this.boletoRepo.update(boletoId, {
        status: '04',
        protestoSolicitado: true,
        updatedAt: new Date(),
      });

      // Registrar histórico
      await this.registrarHistorico({
        boletoId,
        tipoAlteracao: 'PROTESTO',
        statusAnterior: boleto.status,
        statusNovo: '04',
        origem: 'MANUAL',
        alteradoPor: usuarioId,
      });

    } catch (error) {
      console.error('[BoletoService] Erro ao protestar:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private validarDadosEmissao(dados: EmitirBoletoDTO, cliente: ClientePagador): { valido: boolean; erro?: string } {
    // Validar CPF/CNPJ
    if (!this.validarCPFCNPJ(cliente.cpfCnpj)) {
      return { valido: false, erro: 'CPF/CNPJ do pagador inválido' };
    }

    // Validar endereço completo
    if (!cliente.endereco.cep || !cliente.endereco.logradouro || !cliente.endereco.numero ||
        !cliente.endereco.bairro || !cliente.endereco.cidade || !cliente.endereco.uf) {
      return { valido: false, erro: 'Endereço do pagador incompleto' };
    }

    // Validar data de vencimento
    if (dados.dataVencimento < new Date()) {
      return { valido: false, erro: 'Data de vencimento deve ser futura' };
    }

    // Validar valor
    if (dados.valor <= 0) {
      return { valido: false, erro: 'Valor deve ser maior que zero' };
    }

    // Validar espécie CC (Cartão de Crédito)
    if (dados.especieDocumento === '31') {
      // Não permitir juros/multa/desconto
      if (this.config.percentualJurosDia > 0 || this.config.percentualMulta > 0) {
        return { valido: false, erro: 'Espécie CC não permite juros/multa' };
      }
    }

    return { valido: true };
  }

  private montarPayloadRegistro(dados: EmitirBoletoDTO, cliente: ClientePagador): BradescoRegistroRequest {
    return {
      beneficiario: {
        cpfCnpj: this.config.cpfCnpjBeneficiario,
        agencia: this.config.agencia,
        conta: this.config.conta,
        carteira: this.config.carteira,
        negociacao: this.config.negociacao,
      },
      pagador: {
        cpfCnpj: cliente.cpfCnpj,
        nome: cliente.nome,
        endereco: {
          cep: cliente.endereco.cep.replace(/\D/g, ''),
          logradouro: cliente.endereco.logradouro,
          numero: cliente.endereco.numero,
          complemento: cliente.endereco.complemento,
          bairro: cliente.endereco.bairro,
          cidade: cliente.endereco.cidade,
          uf: cliente.endereco.uf,
        },
        telefone: cliente.telefone?.replace(/\D/g, ''),
        email: cliente.email,
      },
      titulo: {
        seuNumero: dados.seuNumero,
        especie: dados.especieDocumento,
        dataEmissao: format(new Date(), 'yyyy-MM-dd'),
        dataVencimento: format(dados.dataVencimento, 'yyyy-MM-dd'),
        valorNominal: dados.valor,
        tipoProtesto: dados.protestoAutomatico ? '2' : '0', // 2=Dias úteis
        diasProtesto: dados.diasProtesto || this.config.prazoProtestoDias,
        tipoBaixa: '1', // Baixar/devolver
        diasBaixa: 30,
        tipoJuros: '2', // Taxa mensal
        juros: this.config.percentualJurosDia,
        tipoMulta: '2', // Percentual
        multa: this.config.percentualMulta,
        aceite: 'N',
        instrucoes: dados.instrucoes,
        mensagens: dados.mensagens,
        cdPagamentoParcial: dados.permitePagamentoParcial ? 'S' : 'N',
      },
    };
  }

  private validarCPFCNPJ(doc: string): boolean {
    const limpo = doc.replace(/\D/g, '');
    
    if (limpo.length === 11) {
      return this.validarCPF(limpo);
    } else if (limpo.length === 14) {
      return this.validarCNPJ(limpo);
    }
    
    return false;
  }

  private validarCPF(cpf: string): boolean {
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    
    return resto === parseInt(cpf[10]);
  }

  private validarCNPJ(cnpj: string): boolean {
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpj[i]) * pesos1[i];
    }
    let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (digito1 !== parseInt(cnpj[12])) return false;
    
    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpj[i]) * pesos2[i];
    }
    let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    
    return digito2 === parseInt(cnpj[13]);
  }

  private mapearTipoAlteracao(status: StatusBoleto): string {
    switch (status) {
      case '61': return 'LIQUIDACAO';
      case '57': return 'BAIXA';
      case '04': return 'PROTESTO';
      default: return 'ALTERACAO';
    }
  }

  private async registrarHistorico(dados: Partial<HistoricoStatus>): Promise<void> {
    const historico: HistoricoStatus = {
      id: this.gerarId(),
      createdAt: new Date(),
      ...dados as any,
    };
    
    await this.historicoRepo.save(historico);
  }

  private gerarId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
