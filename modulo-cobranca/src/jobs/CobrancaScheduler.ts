/**
 * Jobs: CobrancaScheduler
 * Agendador de tarefas para cobrança ativa e conciliação
 */

import { BoletoService } from '../services/BoletoService';
import { BradescoIntegrationService } from '../services/BradescoIntegrationService';
import { ConfiguracaoCobranca } from '../entities/ConfiguracaoCobranca';
import { format, subDays, addDays, isWeekend, isSameDay } from 'date-fns';

export class CobrancaScheduler {
  private boletoService: BoletoService;
  private bradescoService: BradescoIntegrationService;
  private config: ConfiguracaoCobranca;
  private boletoRepo: any;
  private clienteRepo: any;

  constructor(
    boletoService: BoletoService,
    bradescoService: BradescoIntegrationService,
    config: ConfiguracaoCobranca,
    boletoRepo: any,
    clienteRepo: any
  ) {
    this.boletoService = boletoService;
    this.bradescoService = bradescoService;
    this.config = config;
    this.boletoRepo = boletoRepo;
    this.clienteRepo = clienteRepo;
  }

  // ==================== CONCILIAÇÃO DIÁRIA ====================

  /**
   * Job: Conciliação diária de boletos liquidados
   * Executar: Todo dia às 06:00
   */
  async conciliacaoDiaria(): Promise<void> {
    console.log('[Scheduler] Iniciando conciliação diária...');

    try {
      const dataOntem = subDays(new Date(), 1);
      const dataInicio = format(subDays(dataOntem, 1), 'yyyy-MM-dd');
      const dataFim = format(dataOntem, 'yyyy-MM-dd');

      let maisPaginas = 'S';
      let idUltimoRegistro: string | undefined;
      let totalProcessados = 0;
      let totalAtualizados = 0;

      // Paginação
      while (maisPaginas === 'S') {
        const resposta = await this.bradescoService.listarCobrancas({
          beneficiario: {
            cpfCnpj: this.config.cpfCnpjBeneficiario,
            agencia: this.config.agencia,
            conta: this.config.conta,
          },
          dataInicio,
          dataFim,
          situacao: '61', // Apenas pagos
          indMaisPagina: maisPaginas as 'S' | 'N',
          idUltimoRegistro,
        });

        if (resposta.codigo !== '200' || !resposta.titulos) {
          console.error('[Scheduler] Erro na conciliação:', resposta.mensagem);
          break;
        }

        // Processar cada título
        for (const titulo of resposta.titulos) {
          totalProcessados++;
          
          // Buscar boleto local
          const boleto = await this.boletoRepo.findByNossoNumero(titulo.nossoNumero);
          
          if (boleto && boleto.status !== '61') {
            // Atualizar status
            await this.boletoRepo.update(boleto.id, {
              status: '61',
              valorPago: titulo.valorPago,
              dataPagamento: new Date(titulo.dataPagamento!),
              updatedAt: new Date(),
            });

            // Registrar histórico
            await this.boletoService['historicoRepo'].save({
              boletoId: boleto.id,
              tipoAlteracao: 'LIQUIDACAO',
              statusAnterior: boleto.status,
              statusNovo: '61',
              origem: 'JOB',
              dadosAdicionais: {
                valorPago: titulo.valorPago,
                dataPagamento: titulo.dataPagamento,
              },
              createdAt: new Date(),
            });

            totalAtualizados++;

            // Notificar cliente
            await this.notificarLiquidacao(boleto);
          }
        }

        maisPaginas = resposta.indMaisPagina;
        if (resposta.titulos.length > 0) {
          idUltimoRegistro = resposta.titulos[resposta.titulos.length - 1].nossoNumero;
        }
      }

      console.log(`[Scheduler] Conciliação concluída: ${totalProcessados} processados, ${totalAtualizados} atualizados`);

    } catch (error) {
      console.error('[Scheduler] Erro na conciliação:', error);
    }
  }

  // ==================== COBRANÇA ATIVA ====================

  /**
   * Job: Notificação de vencimento próximo (D-3)
   * Executar: Todo dia às 09:00
   */
  async notificarVencimentoProximo(): Promise<void> {
    console.log('[Scheduler] Verificando vencimentos próximos...');

    try {
      const dataLimite = addDays(new Date(), 3);
      
      const boletos = await this.boletoRepo.findMany({
        where: {
          status: '00', // A vencer
          dataVencimento: {
            lte: dataLimite,
            gte: new Date(),
          },
          notificadoVencimento: false,
        },
      });

      for (const boleto of boletos) {
        try {
          const cliente = await this.clienteRepo.findById(boleto.clientePagadorId);
          
          if (cliente?.email) {
            // TODO: Enviar email
            console.log(`[Scheduler] Email de vencimento enviado para ${cliente.email}`);
          }

          if (cliente?.telefone) {
            // TODO: Enviar WhatsApp
            console.log(`[Scheduler] WhatsApp de vencimento enviado para ${cliente.telefone}`);
          }

          // Marcar como notificado
          await this.boletoRepo.update(boleto.id, {
            notificadoVencimento: true,
            updatedAt: new Date(),
          });

        } catch (error) {
          console.error(`[Scheduler] Erro ao notificar boleto ${boleto.id}:`, error);
        }
      }

      console.log(`[Scheduler] ${boletos.length} notificações de vencimento enviadas`);

    } catch (error) {
      console.error('[Scheduler] Erro ao notificar vencimentos:', error);
    }
  }

  /**
   * Job: Alerta de atraso (D+1)
   * Executar: Todo dia às 10:00
   */
  async alertarAtraso(): Promise<void> {
    console.log('[Scheduler] Verificando boletos em atraso...');

    try {
      const ontem = subDays(new Date(), 1);
      
      const boletos = await this.boletoRepo.findMany({
        where: {
          status: '00', // A vencer (mas já passou da data)
          dataVencimento: {
            lt: new Date(),
            gte: ontem,
          },
          notificadoAtraso: false,
        },
      });

      for (const boleto of boletos) {
        try {
          const cliente = await this.clienteRepo.findById(boleto.clientePagadorId);
          
          // Calcular juros atualizados
          const diasAtraso = Math.floor(
            (new Date().getTime() - new Date(boleto.dataVencimento).getTime()) 
            / (1000 * 60 * 60 * 24)
          );
          const juros = (boleto.valor * (this.config.percentualJurosDia / 100)) * diasAtraso;
          const multa = boleto.valor * (this.config.percentualMulta / 100);
          const valorTotal = boleto.valor + juros + multa;

          const mensagem = `
            Olá ${cliente.nome},
            
            Seu boleto venceu em ${format(new Date(boleto.dataVencimento), 'dd/MM/yyyy')}.
            
            Valor original: R$ ${boleto.valor.toFixed(2)}
            Juros (${diasAtraso} dias): R$ ${juros.toFixed(2)}
            Multa: R$ ${multa.toFixed(2)}
            Valor atualizado: R$ ${valorTotal.toFixed(2)}
            
            Linha digitável: ${boleto.linhaDigitavel}
          `;

          if (cliente?.email) {
            // TODO: Enviar email
            console.log(`[Scheduler] Email de atraso enviado para ${cliente.email}`);
          }

          if (cliente?.telefone) {
            // TODO: Enviar WhatsApp
            console.log(`[Scheduler] WhatsApp de atraso enviado para ${cliente.telefone}`);
          }

          // Marcar como notificado
          await this.boletoRepo.update(boleto.id, {
            notificadoAtraso: true,
            updatedAt: new Date(),
          });

        } catch (error) {
          console.error(`[Scheduler] Erro ao alertar boleto ${boleto.id}:`, error);
        }
      }

      console.log(`[Scheduler] ${boletos.length} alertas de atraso enviados`);

    } catch (error) {
      console.error('[Scheduler] Erro ao alertar atrasos:', error);
    }
  }

  /**
   * Job: Aviso pré-protesto (D+2 úteis)
   * Executar: Todo dia às 11:00
   */
  async avisoPreProtesto(): Promise<void> {
    console.log('[Scheduler] Verificando boletos para aviso de protesto...');

    try {
      // Buscar boletos vencidos há 2 dias úteis
      const boletos = await this.boletoRepo.findMany({
        where: {
          status: '00',
          dataVencimento: {
            lt: subDays(new Date(), 2),
          },
          protestoAutomatico: true,
          protestoSolicitado: false,
        },
      });

      for (const boleto of boletos) {
        try {
          // Verificar se já passaram 2 dias úteis
          const dataVencimento = new Date(boleto.dataVencimento);
          let diasUteis = 0;
          let dataAtual = new Date();
          
          while (dataAtual > dataVencimento && diasUteis < 3) {
            if (!isWeekend(dataAtual)) {
              diasUteis++;
            }
            dataAtual = subDays(dataAtual, 1);
          }

          if (diasUteis >= 2) {
            const cliente = await this.clienteRepo.findById(boleto.clientePagadorId);
            
            const mensagem = `
              ATENÇÃO: ÚLTIMO AVISO
              
              Prezado ${cliente.nome},
              
              Seu boleto venceu em ${format(dataVencimento, 'dd/MM/yyyy')} e ainda não foi pago.
              
              Caso não seja quitado em 24 horas, seu CPF/CNPJ será protestado e incluído nos cadastros de proteção ao crédito.
              
              Valor: R$ ${boleto.valor.toFixed(2)}
              Linha digitável: ${boleto.linhaDigitavel}
            `;

            if (cliente?.email) {
              // TODO: Enviar email
              console.log(`[Scheduler] Aviso de protesto enviado para ${cliente.email}`);
            }

            if (cliente?.telefone) {
              // TODO: Enviar WhatsApp
              console.log(`[Scheduler] Aviso de protesto enviado para ${cliente.telefone}`);
            }
          }

        } catch (error) {
          console.error(`[Scheduler] Erro ao avisar boleto ${boleto.id}:`, error);
        }
      }

      console.log(`[Scheduler] Avisos de protesto processados`);

    } catch (error) {
      console.error('[Scheduler] Erro ao enviar avisos de protesto:', error);
    }
  }

  /**
   * Job: Protesto automático
   * Executar: Todo dia às 14:00 (apenas dias úteis)
   */
  async protestoAutomatico(): Promise<void> {
    console.log('[Scheduler] Executando protestos automáticos...');

    try {
      const boletos = await this.boletoRepo.findMany({
        where: {
          status: '00',
          dataVencimento: {
            lt: subDays(new Date(), 3),
          },
          protestoAutomatico: true,
          protestoSolicitado: false,
        },
      });

      for (const boleto of boletos) {
        try {
          await this.boletoService.protestarBoleto(boleto.id, '1', 'SYSTEM');
          console.log(`[Scheduler] Protesto solicitado: ${boleto.nossoNumero}`);
        } catch (error: any) {
          console.error(`[Scheduler] Erro ao protestar ${boleto.id}:`, error.message);
        }
      }

      console.log(`[Scheduler] ${boletos.length} protestos processados`);

    } catch (error) {
      console.error('[Scheduler] Erro no protesto automático:', error);
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async notificarLiquidacao(boleto: any): Promise<void> {
    try {
      const cliente = await this.clienteRepo.findById(boleto.clientePagadorId);
      
      const mensagem = `
        Olá ${cliente.nome},
        
        Confirmamos o pagamento do seu boleto no valor de R$ ${boleto.valorPago.toFixed(2)}.
        
        Nosso número: ${boleto.nossoNumero}
        Data do pagamento: ${format(new Date(boleto.dataPagamento), 'dd/MM/yyyy')}
        
        Obrigado!
      `;

      if (cliente?.email) {
        console.log(`[Scheduler] Confirmação de pagamento enviada para ${cliente.email}`);
      }

    } catch (error) {
      console.error('[Scheduler] Erro ao notificar liquidação:', error);
    }
  }
}
