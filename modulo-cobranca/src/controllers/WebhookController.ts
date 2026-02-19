/**
 * Controller: WebhookController
 * Recebe notificações de liquidação do Bradesco
 */

import { Request, Response } from 'express';

export class WebhookController {
  private boletoRepo: any;
  private historicoRepo: any;
  private webhookRepo: any;

  constructor(boletoRepo: any, historicoRepo: any, webhookRepo: any) {
    this.boletoRepo = boletoRepo;
    this.historicoRepo = historicoRepo;
    this.webhookRepo = webhookRepo;
  }

  /**
   * POST /webhook/bradesco
   * Recebe notificações de liquidação e outros eventos
   */
  async receberNotificacao(req: Request, res: Response): Promise<void> {
    const payload = req.body;
    const ipOrigem = req.ip;
    const headers = req.headers;

    try {
      // 1. Salvar log do webhook recebido
      const webhookLog = await this.webhookRepo.save({
        tipoEvento: this.mapearTipoEvento(payload.tipoEvento),
        payload,
        ipOrigem,
        headers: {
          'user-agent': headers['user-agent'],
          'content-type': headers['content-type'],
        },
        recebidoEm: new Date(),
        processado: false,
      });

      // 2. Responder imediatamente ao Bradesco (ACK)
      res.status(200).json({
        recebido: true,
        id: webhookLog.id,
      });

      // 3. Processar assíncronamente
      this.processarNotificacao(webhookLog.id, payload);

    } catch (error: any) {
      console.error('[WebhookController] Erro ao receber notificação:', error);
      // Mesmo em erro, retornar 200 para não perder a notificação
      res.status(200).json({
        recebido: true,
        erro: 'Erro ao processar, mas notificação foi recebida',
      });
    }
  }

  /**
   * Processa a notificação de forma assíncrona
   */
  private async processarNotificacao(webhookId: string, payload: any): Promise<void> {
    try {
      const { tipoEvento, nossoNumero, seuNumero } = payload;

      // Buscar boleto pelo nosso número
      const boleto = await this.boletoRepo.findByNossoNumero(nossoNumero);
      
      if (!boleto) {
        console.warn(`[WebhookController] Boleto não encontrado: ${nossoNumero}`);
        await this.webhookRepo.update(webhookId, {
          processado: true,
          processadoEm: new Date(),
          erroProcessamento: 'Boleto não encontrado',
        });
        return;
      }

      const statusAnterior = boleto.status;
      let statusNovo = statusAnterior;
      let tipoAlteracao = 'ALTERACAO';
      const dadosAtualizacao: any = {};

      // Processar conforme tipo de evento
      switch (tipoEvento) {
        case 'LIQUIDACAO':
          statusNovo = '61'; // Pago
          tipoAlteracao = 'LIQUIDACAO';
          dadosAtualizacao.valorPago = payload.valorPago || payload.valorNominal;
          dadosAtualizacao.dataPagamento = new Date(payload.dataPagamento || payload.dataCredito);
          dadosAtualizacao.situacaoPagamento = payload.tipoLiquidacao === 'PARCIAL' ? '00' : '01';
          break;

        case 'BAIXA':
          statusNovo = '57'; // Baixado
          tipoAlteracao = 'BAIXA';
          dadosAtualizacao.baixado = true;
          break;

        case 'PROTESTO':
          statusNovo = '04'; // Protesto solicitado
          tipoAlteracao = 'PROTESTO';
          dadosAtualizacao.protestoSolicitado = true;
          break;

        case 'ALTERACAO':
          // Atualizar campos alterados
          if (payload.novoVencimento) {
            dadosAtualizacao.dataVencimento = new Date(payload.novoVencimento);
          }
          if (payload.novoValor) {
            dadosAtualizacao.valor = payload.novoValor;
          }
          break;

        case 'REJEICAO':
          console.warn(`[WebhookController] Rejeição no boleto ${nossoNumero}:`, payload.motivo);
          break;

        default:
          console.log(`[WebhookController] Evento não tratado: ${tipoEvento}`);
      }

      // Atualizar boleto se necessário
      if (statusNovo !== statusAnterior || Object.keys(dadosAtualizacao).length > 0) {
        await this.boletoRepo.update(boleto.id, {
          ...dadosAtualizacao,
          status: statusNovo,
          updatedAt: new Date(),
        });

        // Registrar histórico
        await this.historicoRepo.save({
          boletoId: boleto.id,
          tipoAlteracao,
          statusAnterior,
          statusNovo,
          origem: 'WEBHOOK',
          dadosAdicionais: payload,
          createdAt: new Date(),
        });

        // TODO: Enviar notificação ao cliente (email/WhatsApp)
        // await this.notificarCliente(boleto, tipoAlteracao);
      }

      // Marcar webhook como processado
      await this.webhookRepo.update(webhookId, {
        processado: true,
        processadoEm: new Date(),
      });

    } catch (error: any) {
      console.error('[WebhookController] Erro ao processar notificação:', error);
      await this.webhookRepo.update(webhookId, {
        processado: true,
        processadoEm: new Date(),
        erroProcessamento: error.message,
      });
    }
  }

  /**
   * Mapeia tipo de evento do Bradesco para nosso enum
   */
  private mapearTipoEvento(tipo: string): string {
    const mapeamento: Record<string, string> = {
      'LIQUIDACAO': 'LIQUIDACAO',
      'BAIXA': 'BAIXA',
      'PROTESTO': 'PROTESTO',
      'ALTERACAO': 'ALTERACAO',
      'REJEICAO': 'REJEICAO',
    };
    return mapeamento[tipo] || 'OUTRO';
  }

  /**
   * GET /webhook/logs
   * Lista logs de webhooks recebidos
   */
  async listarLogs(req: Request, res: Response): Promise<void> {
    try {
      const { processado, page = 1, limit = 50 } = req.query;

      const filtros: any = {};
      if (processado !== undefined) {
        filtros.processado = processado === 'true';
      }

      const logs = await this.webhookRepo.findMany({
        where: filtros,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { recebidoEm: 'desc' },
      });

      res.status(200).json({
        sucesso: true,
        logs,
        paginacao: {
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error: any) {
      console.error('[WebhookController] Erro ao listar logs:', error);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao listar logs',
      });
    }
  }

  /**
   * POST /webhook/reprocessar/:id
   * Reprocessa um webhook que falhou
   */
  async reprocessar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const webhook = await this.webhookRepo.findById(id);
      if (!webhook) {
        res.status(404).json({
          sucesso: false,
          erro: 'Webhook não encontrado',
        });
        return;
      }

      // Reprocessar
      await this.processarNotificacao(id, webhook.payload);

      res.status(200).json({
        sucesso: true,
        mensagem: 'Webhook reprocessado',
      });
    } catch (error: any) {
      console.error('[WebhookController] Erro ao reprocessar:', error);
      res.status(500).json({
        sucesso: false,
        erro: error.message,
      });
    }
  }
}
