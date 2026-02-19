import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== COMPANY ROUTES (formerly CLIENT) ====================
  // Renaming router to 'companies' is better, but 'clients' keeps frontend compatible for now? 
  // No, I should break it to be clean. Frontend needs update anyway.
  companies: router({ // Changed from clients
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCompaniesByUserId(ctx.user.id);
    }),

    search: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        taxRegime: z.string().optional(),
        personType: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.searchCompanies(ctx.user.id, input.searchTerm, {
          taxRegime: input.taxRegime,
          personType: input.personType,
        });
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getCompanyById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        personType: z.enum(["juridica", "fisica"]),
        cnpj: z.string().optional(), // Made optional to match schema allow null
        cpf: z.string().optional(),
        name: z.string(),
        taxRegime: z.enum(["simples_nacional", "lucro_presumido", "lucro_real", "mei", "isento"]).optional(),
        inscricaoEstadual: z.string().optional(),
        emails: z.any().optional(), // jsonb
        whatsapps: z.any().optional(), // jsonb
        // New fields
        accessCode: z.string().optional(),
        certificatePath: z.string().optional(),
        certificatePasswordHash: z.string().optional(),
        certificateExpiresAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Sanitize CNPJ and CPF
        const sanitizedInput = {
          ...input,
          cnpj: input.cnpj ? input.cnpj.replace(/\D/g, "") : undefined,
          cpf: input.cpf ? input.cpf.replace(/\D/g, "") : undefined,
        };

        return await db.createCompany({
          ...sanitizedInput,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        personType: z.enum(["juridica", "fisica"]).optional(),
        cnpj: z.string().optional(),
        cpf: z.string().optional(),
        name: z.string().optional(),
        taxRegime: z.enum(["simples_nacional", "lucro_presumido", "lucro_real", "mei", "isento"]).optional(),
        inscricaoEstadual: z.string().optional(),
        emails: z.any().optional(),
        whatsapps: z.any().optional(),
        active: z.boolean().optional(),
        accessCode: z.string().optional(),
        certificatePath: z.string().optional(),
        certificatePasswordHash: z.string().optional(),
        certificateExpiresAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;

        // Sanitize CNPJ and CPF if present
        const sanitizedData = {
          ...data,
          cnpj: data.cnpj ? data.cnpj.replace(/\D/g, "") : undefined,
          cpf: data.cpf ? data.cpf.replace(/\D/g, "") : undefined,
        };

        return await db.updateCompany(id, sanitizedData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        return await db.deleteCompany(input.id);
      }),
  }),

  // ==================== DIGITAL CERTIFICATE ROUTES ====================
  certificates: router({
    listByCompany: protectedProcedure // Renamed from listByClient
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getDigitalCertificatesByCompanyId(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        certificateName: z.string().optional(),
        issuer: z.string().optional(),
        serialNumber: z.string().optional(),
        issueDate: z.date().optional(),
        expirationDate: z.date(),
        status: z.enum(["integrado", "a_vencer", "atencao"]),
      }))
      .mutation(async ({ input }) => {
        return await db.createDigitalCertificate(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(), // This is still serial int
        certificateName: z.string().optional(),
        issuer: z.string().optional(),
        serialNumber: z.string().optional(),
        issueDate: z.date().optional(),
        expirationDate: z.date().optional(),
        status: z.enum(["integrado", "a_vencer", "atencao"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDigitalCertificate(id, data);
      }),
  }),

  // ==================== PROCURACAO ROUTES ====================
  procuracoes: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getProcuracoesByCompanyId(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        tipo: z.string().optional(),
        numero: z.string().optional(),
        dataEmissao: z.date().optional(),
        dataValidade: z.date().optional(),
        status: z.enum(["ativa", "vencida", "revogada"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProcuracao(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tipo: z.string().optional(),
        numero: z.string().optional(),
        dataEmissao: z.date().optional(),
        dataValidade: z.date().optional(),
        status: z.enum(["ativa", "vencida", "revogada"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProcuracao(id, data);
      }),
  }),

  // ==================== FISCAL PROCESS ROUTES ====================
  fiscalProcesses: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getFiscalProcessesByCompanyId(input.companyId);
      }),

    listByType: protectedProcedure
      .input(z.object({
        processType: z.enum(["pgdas", "pgmei", "dctfweb", "fgts_digital", "parcelamentos", "certidoes", "caixas_postais", "defis", "dirf"])
      }))
      .query(async ({ ctx, input }) => {
        return await db.getFiscalProcessesByType(ctx.user.id, input.processType);
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFiscalProcessStats(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        processType: z.enum(["pgdas", "pgmei", "dctfweb", "fgts_digital", "parcelamentos", "certidoes", "caixas_postais", "defis", "dirf"]),
        referenceMonth: z.number().optional(),
        referenceYear: z.number(),
        status: z.enum(["em_dia", "pendente", "atencao"]).optional(),
        dueDate: z.date().optional(),
        completedDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createFiscalProcess(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["em_dia", "pendente", "atencao"]).optional(),
        dueDate: z.date().optional(),
        completedDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateFiscalProcess(id, data);
      }),
  }),

  // ==================== DECLARATION ROUTES ====================
  declarations: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getDeclarationsByCompanyId(input.companyId);
      }),

    listByType: protectedProcedure
      .input(z.object({
        declarationType: z.enum(["pgdas", "pgmei", "dctfweb", "fgts_digital", "defis", "dirf"])
      }))
      .query(async ({ ctx, input }) => {
        return await db.getDeclarationsByType(ctx.user.id, input.declarationType);
      }),

    getStats: protectedProcedure
      .input(z.object({
        declarationType: z.enum(["pgdas", "pgmei", "dctfweb", "fgts_digital", "defis", "dirf"])
      }))
      .query(async ({ ctx, input }) => {
        return await db.getDeclarationStats(ctx.user.id, input.declarationType);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        processId: z.number().optional(),
        declarationType: z.enum(["pgdas", "pgmei", "dctfweb", "fgts_digital", "defis", "dirf"]),
        referenceMonth: z.number().optional(),
        referenceYear: z.number(),
        declared: z.boolean().optional(),
        declarationDate: z.date().optional(),
        protocolNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createDeclaration(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        declared: z.boolean().optional(),
        declarationDate: z.date().optional(),
        protocolNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDeclaration(id, data);
      }),
  }),

  // ==================== RBT12 SUBLIMIT ROUTES ====================
  rbt12: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getRbt12SublimitsByUserId(ctx.user.id, input.limit);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        referenceYear: z.number(),
        rbt12Value: z.string().optional(), // decimal as string
        sublimitValue: z.string().optional(),
        status: z.enum(["dentro", "proximo", "excedido"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createRbt12Sublimit(input);
      }),
  }),

  // ==================== E-CAC MESSAGE ROUTES ====================
  ecacMessages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getEcacMessagesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        messageType: z.enum(["ecac", "simples_nacional", "fazenda"]),
        subject: z.string(),
        content: z.string().optional(),
        messageDate: z.date(),
        read: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createEcacMessage(input);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.markEcacMessageAsRead(input.id);
      }),
  }),

  // ==================== NOTIFICATION ROUTES ====================
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotificationsByUserId(ctx.user.id);
    }),

    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.searchNotifications(ctx.user.id, input.searchTerm);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid().optional(),
        title: z.string(),
        description: z.string().optional(),
        processType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createNotification({
          ...input,
          userId: ctx.user.id,
        });
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.markNotificationAsRead(input.id);
      }),
  }),

  // ==================== FISCAL REPORT ROUTES ====================
  fiscalReports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFiscalReportsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        reportType: z.string(),
        reportTitle: z.string(),
        reportContent: z.string().optional(),
        referenceMonth: z.number().optional(),
        referenceYear: z.number(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createFiscalReport(input);
      }),
  }),

  // ==================== SETTINGS ROUTES ====================
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSettingsByUserId(ctx.user.id);
    }),

    upsert: protectedProcedure
      .input(z.object({
        numeroDisparo: z.string().optional(),
        emailDisparo: z.string().optional(),
        certificadoDigitalId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertSettings(ctx.user.id, input);
      }),
  }),

  // ==================== SCHEDULE ROUTES ====================
  schedules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSchedulesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        scheduleType: z.enum(["das_simples", "das_mei", "parcelamentos", "dctfweb", "declaracoes"]),
        dayOfMonth: z.number().min(1).max(31),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createSchedule({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateSchedule(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteSchedule(input.id);
      }),
  }),

  // ==================== API CONSULTAS ROUTES ====================
  apiConsultas: router({
    consultarCNDFederal: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new Error("Empresa não encontrada");
        }

        const { consultarCNDFederal } = await import("./infosimples");

        try {
          // Passa data de nascimento se for Pessoa Física
          const resultado = await consultarCNDFederal(
            company.cnpj || company.cpf || "", // Handle cnpj/cpf
            company.personType === "fisica" && company.dataNascimento ? company.dataNascimento : undefined
          );

          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_federal",
            situacao: resultado.data?.situacao || resultado.code_message,
            numeroCertidao: resultado.data?.numero_certidao,
            dataEmissao: resultado.data?.data_emissao ? new Date(resultado.data.data_emissao) : undefined,
            dataValidade: resultado.data?.data_validade ? new Date(resultado.data.data_validade) : undefined,
            validadeFim: resultado.data?.validade_fim_data ? new Date(resultado.data.validade_fim_data) : undefined,
            siteReceipt: resultado.data?.site_receipt,
            respostaCompleta: JSON.stringify(resultado),
            sucesso: resultado.code === 200,
            mensagemErro: resultado.code !== 200 ? resultado.code_message : undefined,
          });

          return {
            sucesso: resultado.code === 200,
            situacao: resultado.data?.situacao,
            numeroCertidao: resultado.data?.numero_certidao,
            dataEmissao: resultado.data?.data_emissao,
            dataValidade: resultado.data?.data_validade,
            mensagem: resultado.code_message,
          };
        } catch (error: any) {
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_federal",
            sucesso: false,
            mensagemErro: error.message,
          });
          throw error;
        }
      }),

    consultarCNDEstadual: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new Error("Empresa não encontrada");
        }

        if (!company.inscricaoEstadual) {
          throw new Error("Empresa não possui Inscrição Estadual cadastrada");
        }

        const { consultarCNDEstadual } = await import("./infosimples");

        try {
          const resultado = await consultarCNDEstadual(
            company.inscricaoEstadual,
            company.personType === "juridica" ? (company.cnpj || undefined) : undefined
          );

          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_estadual",
            situacao: resultado.data?.situacao || resultado.code_message,
            numeroCertidao: resultado.data?.numero_certidao,
            dataEmissao: resultado.data?.data_emissao ? new Date(resultado.data.data_emissao) : undefined,
            dataValidade: resultado.data?.data_validade ? new Date(resultado.data.data_validade) : undefined,
            validadeFim: resultado.data?.validade_fim_data ? new Date(resultado.data.validade_fim_data) : undefined,
            siteReceipt: resultado.data?.site_receipt,
            respostaCompleta: JSON.stringify(resultado),
            sucesso: resultado.code === 200,
            mensagemErro: resultado.code !== 200 ? resultado.code_message : undefined,
          });

          return {
            sucesso: resultado.code === 200,
            situacao: resultado.data?.situacao,
            numeroCertidao: resultado.data?.numero_certidao,
            dataEmissao: resultado.data?.data_emissao,
            dataValidade: resultado.data?.data_validade,
            validadeFim: resultado.data?.validade_fim_data,
            siteReceipt: resultado.data?.site_receipt,
            mensagem: resultado.code_message,
          };
        } catch (error: any) {
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_estadual",
            sucesso: false,
            mensagemErro: error.message,
          });
          throw error;
        }
      }),

    consultarRegularidadeFGTS: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new Error("Empresa não encontrada");
        }

        if (company.personType !== "juridica") {
          throw new Error("Regularidade FGTS disponível apenas para Pessoa Jurídica");
        }

        const { consultarRegularidadeFGTS } = await import("./infosimples");

        try {
          const resultado = await consultarRegularidadeFGTS(company.cnpj || "");

          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "regularidade_fgts",
            situacao: resultado.data?.situacao || resultado.code_message,
            numeroCertidao: resultado.data?.numero_crf,
            dataEmissao: resultado.data?.data_emissao ? new Date(resultado.data.data_emissao) : undefined,
            dataValidade: resultado.data?.data_validade ? new Date(resultado.data.data_validade) : undefined,
            validadeFim: resultado.data?.validade_fim_data ? new Date(resultado.data.validade_fim_data) : undefined,
            siteReceipt: resultado.data?.site_receipt,
            respostaCompleta: JSON.stringify(resultado),
            sucesso: resultado.code === 200,
            mensagemErro: resultado.code !== 200 ? resultado.code_message : undefined,
          });

          return {
            sucesso: resultado.code === 200,
            situacao: resultado.data?.situacao,
            numeroCertidao: resultado.data?.numero_crf,
            dataEmissao: resultado.data?.data_emissao,
            dataValidade: resultado.data?.data_validade,
            validadeFim: resultado.data?.validade_fim_data,
            siteReceipt: resultado.data?.site_receipt,
            mensagem: resultado.code_message,
          };
        } catch (error: any) {
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "regularidade_fgts",
            sucesso: false,
            mensagemErro: error.message,
          });
          throw error;
        }
      }),

    consultarCaixaPostalECAC: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new Error("Empresa não encontrada");
        }

        if (company.personType !== "juridica") {
          throw new Error("Consulta de Caixa Postal e-CAC disponível apenas para Pessoa Jurídica");
        }

        const { consultarCaixaPostalECAC } = await import("./infosimples");

        try {
          const resultado = await consultarCaixaPostalECAC(company.cnpj || "");

          // Processa mensagens retornadas
          const mensagens = resultado.data?.mensagens || [];
          const totalMensagens = resultado.data?.total_mensagens || mensagens.length;
          const mensagensNaoLidas = resultado.data?.mensagens_nao_lidas || mensagens.filter(m => !m.lida).length;

          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "ecac_caixa_postal",
            respostaCompleta: JSON.stringify(resultado),
            sucesso: resultado.code === 200,
            mensagemErro: resultado.code !== 200 ? resultado.code_message : undefined,
          });

          // Salva as mensagens no banco como ecacMessages
          for (const msg of mensagens) {
            await db.createEcacMessage({
              companyId: input.companyId,
              messageType: "ecac",
              subject: msg.titulo || "Sem título",
              content: msg.conteudo || "",
              messageDate: msg.data_envio ? new Date(msg.data_envio) : new Date(),
              read: msg.lida || false,
            });
          }

          return {
            sucesso: resultado.code === 200,
            totalMensagens,
            mensagensNaoLidas,
            mensagens: mensagens.map(m => ({
              id: m.id,
              tipo: m.tipo,
              titulo: m.titulo,
              conteudo: m.conteudo,
              dataEnvio: m.data_envio,
              lida: m.lida,
              prioridade: m.prioridade,
            })),
            mensagem: resultado.code_message,
          };
        } catch (error: any) {
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "ecac_caixa_postal",
            sucesso: false,
            mensagemErro: error.message,
          });
          throw error;
        }
      }),

    historico: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
      }))
      .query(async ({ input }) => {
        return await db.getApiConsultasByCompany(input.companyId);
      }),

    minhasConsultas: protectedProcedure.query(async ({ ctx }) => {
      return await db.getApiConsultasByUser(ctx.user.id);
    }),
  }),

  // ==================== EXECUTION LOGS ROUTES (New) ====================
  executionLogs: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getExecutionLogsByCompanyId(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid().optional(),
        serviceType: z.enum(['ECAC', 'SIMPLES', 'FGTS']).optional(),
        status: z.enum(['SUCCESS', 'ERROR', 'PENDING']).optional(),
        resultSummary: z.any().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createExecutionLog(input);
      }),
  }),

  // ==================== PENDENCIES ROUTES (New) ====================
  pendencies: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getPendenciesByCompanyId(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid().optional(),
        source: z.enum(['RECEITA', 'DIVIDA_ATIVA']).optional(),
        description: z.string().optional(),
        amount: z.string().optional(), // decimal as string
      }))
      .mutation(async ({ input }) => {
        return await db.createPendency(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
