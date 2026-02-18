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

  // ==================== CLIENT ROUTES ====================
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientsByUserId(ctx.user.id);
    }),

    search: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        regimeTributario: z.string().optional(),
        personType: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.searchClients(ctx.user.id, input.searchTerm, {
          regimeTributario: input.regimeTributario,
          personType: input.personType,
        });
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        personType: z.enum(["juridica", "fisica"]),
        cnpjCpf: z.string(),
        razaoSocialNome: z.string(),
        regimeTributario: z.enum(["simples_nacional", "lucro_presumido", "lucro_real", "mei", "isento"]).optional(),
        inscricaoEstadual: z.string().optional(),
        emails: z.string().optional(), // JSON string
        whatsapps: z.string().optional(), // JSON string
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createClient({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        personType: z.enum(["juridica", "fisica"]).optional(),
        cnpjCpf: z.string().optional(),
        razaoSocialNome: z.string().optional(),
        regimeTributario: z.enum(["simples_nacional", "lucro_presumido", "lucro_real", "mei", "isento"]).optional(),
        inscricaoEstadual: z.string().optional(),
        emails: z.string().optional(),
        whatsapps: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateClient(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteClient(input.id);
      }),
  }),

  // ==================== DIGITAL CERTIFICATE ROUTES ====================
  certificates: router({
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDigitalCertificatesByClientId(input.clientId);
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
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
        id: z.number(),
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
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProcuracoesByClientId(input.clientId);
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
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
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFiscalProcessesByClientId(input.clientId);
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
        clientId: z.number(),
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
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeclarationsByClientId(input.clientId);
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
        clientId: z.number(),
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
        clientId: z.number(),
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
        clientId: z.number(),
        messageTitle: z.string(),
        messageContent: z.string().optional(),
        messageDate: z.date(),
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
        clientId: z.number().optional(),
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
        clientId: z.number(),
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
        clientId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const client = await db.getClientById(input.clientId);
        if (!client) {
          throw new Error("Cliente não encontrado");
        }

        const { consultarCNDFederal } = await import("./infosimples");
        
        try {
          // Passa data de nascimento se for Pessoa Física
          const resultado = await consultarCNDFederal(
            client.cnpjCpf,
            client.personType === "fisica" && client.dataNascimento ? client.dataNascimento : undefined
          );
          
          // Salvar consulta no banco
          await db.createApiConsulta({
            clientId: input.clientId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_federal",
            situacao: resultado.data?.situacao,
            numeroCertidao: resultado.data?.numero_certidao,
            dataEmissao: resultado.data?.data_emissao ? new Date(resultado.data.data_emissao) : undefined,
            dataValidade: resultado.data?.data_validade ? new Date(resultado.data.data_validade) : undefined,
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
          // Salvar erro no banco
          await db.createApiConsulta({
            clientId: input.clientId,
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
        clientId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const client = await db.getClientById(input.clientId);
        if (!client) {
          throw new Error("Cliente não encontrado");
        }

        if (!client.inscricaoEstadual) {
          throw new Error("Cliente não possui Inscrição Estadual cadastrada");
        }

        const { consultarCNDEstadual } = await import("./infosimples");
        
        try {
          const resultado = await consultarCNDEstadual(
            client.inscricaoEstadual,
            client.personType === "juridica" ? client.cnpjCpf : undefined
          );
          
          await db.createApiConsulta({
            clientId: input.clientId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_estadual",
            situacao: resultado.data?.situacao,
            numeroCertidao: resultado.data?.numero_certidao,
            dataEmissao: resultado.data?.data_emissao ? new Date(resultado.data.data_emissao) : undefined,
            dataValidade: resultado.data?.data_validade ? new Date(resultado.data.data_validade) : undefined,
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
            clientId: input.clientId,
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
        clientId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const client = await db.getClientById(input.clientId);
        if (!client) {
          throw new Error("Cliente não encontrado");
        }

        if (client.personType !== "juridica") {
          throw new Error("Regularidade FGTS disponível apenas para Pessoa Jurídica");
        }

        const { consultarRegularidadeFGTS } = await import("./infosimples");
        
        try {
          const resultado = await consultarRegularidadeFGTS(client.cnpjCpf);
          
          await db.createApiConsulta({
            clientId: input.clientId,
            userId: ctx.user.id,
            tipoConsulta: "regularidade_fgts",
            situacao: resultado.data?.situacao,
            numeroCertidao: resultado.data?.numero_crf,
            dataEmissao: resultado.data?.data_emissao ? new Date(resultado.data.data_emissao) : undefined,
            dataValidade: resultado.data?.data_validade ? new Date(resultado.data.data_validade) : undefined,
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
            mensagem: resultado.code_message,
          };
        } catch (error: any) {
          await db.createApiConsulta({
            clientId: input.clientId,
            userId: ctx.user.id,
            tipoConsulta: "regularidade_fgts",
            sucesso: false,
            mensagemErro: error.message,
          });
          throw error;
        }
      }),

    historico: protectedProcedure
      .input(z.object({
        clientId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getApiConsultasByClient(input.clientId);
      }),

    minhasConsultas: protectedProcedure.query(async ({ ctx }) => {
      return await db.getApiConsultasByUser(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
