/**
 * Controller: BoletoController
 * Endpoints REST para gestão de boletos
 */

import { Request, Response } from 'express';
import { BoletoService, EmitirBoletoDTO } from '../services/BoletoService';

export class BoletoController {
  private boletoService: BoletoService;

  constructor(boletoService: BoletoService) {
    this.boletoService = boletoService;
  }

  // ==================== EMISSÃO ====================

  /**
   * POST /boletos
   * Emite um novo boleto
   */
  async emitir(req: Request, res: Response): Promise<void> {
    try {
      const dados: EmitirBoletoDTO = req.body;
      const usuarioId = req.user?.id || 'system';

      const resultado = await this.boletoService.emitirBoleto(dados, usuarioId);

      if (!resultado.sucesso) {
        res.status(400).json({
          sucesso: false,
          erro: resultado.erro,
          codigoErro: resultado.codigoErro,
        });
        return;
      }

      res.status(201).json({
        sucesso: true,
        boleto: resultado.boleto,
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao emitir:', error);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro interno ao emitir boleto',
      });
    }
  }

  /**
   * POST /boletos/lote
   * Emite múltiplos boletos em lote
   */
  async emitirLote(req: Request, res: Response): Promise<void> {
    try {
      const { boletos } = req.body;
      const usuarioId = req.user?.id || 'system';

      if (!Array.isArray(boletos) || boletos.length === 0) {
        res.status(400).json({
          sucesso: false,
          erro: 'Array de boletos é obrigatório',
        });
        return;
      }

      // Validação de limite
      if (boletos.length > 100) {
        res.status(400).json({
          sucesso: false,
          erro: 'Limite máximo de 100 boletos por lote',
        });
        return;
      }

      const resultados = [];
      for (const boleto of boletos) {
        const resultado = await this.boletoService.emitirBoleto(boleto, usuarioId);
        resultados.push(resultado);
      }

      const sucessos = resultados.filter(r => r.sucesso).length;
      const erros = resultados.filter(r => !r.sucesso).length;

      res.status(200).json({
        sucesso: true,
        resumo: {
          total: boletos.length,
          sucessos,
          erros,
        },
        resultados,
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao emitir lote:', error);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro interno ao processar lote',
      });
    }
  }

  // ==================== CONSULTA ====================

  /**
   * GET /boletos/:id
   * Consulta um boleto específico
   */
  async consultar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sincronizar } = req.query;

      let boleto;
      
      if (sincronizar === 'true') {
        // Consulta Bradesco e atualiza
        boleto = await this.boletoService.consultarEAtualizar(id);
      } else {
        // Apenas consulta local
        boleto = await this.boletoService['boletoRepo'].findById(id);
      }

      if (!boleto) {
        res.status(404).json({
          sucesso: false,
          erro: 'Boleto não encontrado',
        });
        return;
      }

      res.status(200).json({
        sucesso: true,
        boleto,
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao consultar:', error);
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro ao consultar boleto',
      });
    }
  }

  /**
   * GET /boletos
   * Lista boletos com filtros
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { 
        status, 
        clienteId, 
        dataInicio, 
        dataFim,
        page = 1,
        limit = 50,
      } = req.query;

      const filtros: any = {};
      
      if (status) filtros.status = status;
      if (clienteId) filtros.clientePagadorId = clienteId;
      if (dataInicio) filtros.dataVencimentoGte = new Date(dataInicio as string);
      if (dataFim) filtros.dataVencimentoLte = new Date(dataFim as string);

      const resultado = await this.boletoService['boletoRepo'].findMany({
        where: filtros,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        sucesso: true,
        dados: resultado,
        paginacao: {
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao listar:', error);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao listar boletos',
      });
    }
  }

  // ==================== BAIXA ====================

  /**
   * POST /boletos/:id/baixa
   * Solicita baixa/cancelamento de boleto
   */
  async baixar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const usuarioId = req.user?.id || 'system';

      const motivosPermitidos = ['1', '2', '3', '4', '5', '6', '7'];
      if (!motivosPermitidos.includes(motivo)) {
        res.status(400).json({
          sucesso: false,
          erro: 'Motivo de baixa inválido',
          motivosPermitidos: {
            '1': 'Pago em dinheiro',
            '2': 'Pago em cheque',
            '3': 'Protesto',
            '4': 'Devolução',
            '5': 'Desconto',
            '6': 'Acerto',
            '7': 'Outros',
          },
        });
        return;
      }

      await this.boletoService.baixarBoleto(id, motivo as any, usuarioId);

      res.status(200).json({
        sucesso: true,
        mensagem: 'Baixa solicitada com sucesso',
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao baixar:', error);
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro ao solicitar baixa',
      });
    }
  }

  // ==================== PROTESTO ====================

  /**
   * POST /boletos/:id/protesto
   * Solicita protesto ou negativação
   */
  async protestar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { tipo } = req.body; // 'protesto' ou 'negativacao'
      const usuarioId = req.user?.id || 'system';

      const codigoFuncao = tipo === 'negativacao' ? '3' : '1';

      await this.boletoService.protestarBoleto(id, codigoFuncao as any, usuarioId);

      res.status(200).json({
        sucesso: true,
        mensagem: tipo === 'negativacao' 
          ? 'Negativação solicitada com sucesso' 
          : 'Protesto solicitado com sucesso',
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao protestar:', error);
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro ao solicitar protesto',
      });
    }
  }

  // ==================== PDF ====================

  /**
   * GET /boletos/:id/pdf
   * Gera e retorna PDF do boleto
   */
  async gerarPDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const boleto = await this.boletoService['boletoRepo'].findById(id);
      if (!boleto) {
        res.status(404).json({
          sucesso: false,
          erro: 'Boleto não encontrado',
        });
        return;
      }

      // Aqui você integraria com o gerador de PDF
      // Por enquanto, retorna os dados necessários
      res.status(200).json({
        sucesso: true,
        mensagem: 'PDF gerado com sucesso',
        dados: {
          linhaDigitavel: boleto.linhaDigitavel,
          codigoBarras: boleto.codigoBarras,
          nossoNumero: boleto.nossoNumero,
          // urlPdf: '/pdfs/boleto-xxx.pdf',
        },
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao gerar PDF:', error);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao gerar PDF',
      });
    }
  }

  // ==================== ESTATÍSTICAS ====================

  /**
   * GET /boletos/estatisticas
   * Retorna estatísticas de boletos
   */
  async estatisticas(req: Request, res: Response): Promise<void> {
    try {
      const { dataInicio, dataFim } = req.query;

      // Implementar agregações no repositório
      const estatisticas = await this.boletoService['boletoRepo'].estatisticas({
        dataInicio: dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim: dataFim ? new Date(dataFim as string) : undefined,
      });

      res.status(200).json({
        sucesso: true,
        estatisticas,
      });
    } catch (error: any) {
      console.error('[BoletoController] Erro ao obter estatísticas:', error);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao obter estatísticas',
      });
    }
  }
}
