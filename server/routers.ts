import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Traduz códigos de erro da API InfoSimples para mensagens amigáveis em PT-BR
function friendlyApiMessage(code: number, fallbackMsg?: string): string {
  const messages: Record<number, string> = {
    600: "Limite de consultas atingido. Aguarde alguns minutos e tente novamente.",
    604: "Não foi possível acessar o site de origem. Tente novamente mais tarde.",
    606: "Erro no processamento interno do site de origem (ex: timeout ou erro inesperado). Tente novamente.",
    607: "Parâmetro inválido (CNPJ/CPF). Verifique se o documento está correto.",
    609: "Limite de tentativas da API excedido. Aguarde alguns minutos e tente novamente.",
    611: "Dados insuficientes ou divergentes para emissão automática pela internet. Verifique pendências no órgão.",
    617: "Empresa não cadastrada no órgão consultado ou dados não encontrados.",
  };
  return messages[code] || fallbackMsg || `Erro desconhecido (código ${code})`;
}

// Extrai e junta os erros específicos retornados pela API
function getApiErrorDetails(resultado: any): string | undefined {
  if (resultado.errors && Array.isArray(resultado.errors) && resultado.errors.length > 0) {
    return resultado.errors.join("; ");
  }
  return undefined;
}

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
        uf: z.string().length(2).optional(),
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
        uf: z.string().length(2).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;

        // Sanitize CNPJ and CPF if present
        const sanitizedData = {
          ...data,
          cnpj: data.cnpj ? data.cnpj.replace(/\D/g, "") : undefined,
          cpf: data.cpf ? data.cpf.replace(/\D/g, "") : undefined,
        };

        try {
          return await db.updateCompany(id, sanitizedData);
        } catch (error: any) {
          // Handle unique constraint violation on CNPJ
          if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === '23505') {
            throw new Error("CNPJ já cadastrado para outra empresa. Verifique o número digitado.");
          }
          throw new Error(`Erro ao atualizar cliente: ${error.message}`);
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        return await db.deleteCompany(input.id);
      }),

    bulkCreate: protectedProcedure
      .input(z.array(z.any()))
      .mutation(async ({ ctx, input }) => {
        const data = input.map(item => ({
          ...item,
          userId: ctx.user.id,
          cnpj: item.cnpj ? item.cnpj.replace(/\D/g, "") : undefined,
          cpf: item.cpf ? item.cpf.replace(/\D/g, "") : undefined,
        }));
        return await db.bulkCreateCompanies(data);
      }),
  }),

  // ==================== DIGITAL CERTIFICATE ROUTES ====================
  certificates: router({
    listAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDigitalCertificatesByUserId(ctx.user.id);
    }),

    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getDigitalCertificatesByCompanyId(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        name: z.string().optional(),
        serialNumber: z.string().optional(),
        issuer: z.string().optional(),
        subject: z.string().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        path: z.string().optional(),
        passwordHash: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { name, ...data } = input;
        const cert = await db.createDigitalCertificate({
          name: name || "Certificado",
          ...data,
        });

        // Sincronizar com a tabela de empresas para mostrar o status "Integrado"
        await db.updateCompany(input.companyId, {
          certificatePath: input.path || "linked_certificate",
          certificatePasswordHash: input.passwordHash,
          certificateExpiresAt: input.validUntil,
        });

        return cert;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        serialNumber: z.string().optional(),
        issuer: z.string().optional(),
        subject: z.string().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        path: z.string().optional(),
        passwordHash: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDigitalCertificate(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDigitalCertificate(input.id);
      }),
  }),

  // ==================== PROCURACAO ROUTES ====================
  procuracoes: router({
    listAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProcuracoesByUserId(ctx.user.id);
    }),

    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getProcuracoesByCompanyId(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        type: z.enum(["ecac", "simples_nacional", "outros"]).default("ecac"),
        cpfRepresentante: z.string(),
        nomeRepresentante: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProcuracao(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["ecac", "simples_nacional", "outros"]).optional(),
        cpfRepresentante: z.string().optional(),
        nomeRepresentante: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProcuracao(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProcuracao(input.id);
      }),
  }),

  // ==================== FISCAL PROCESS ROUTES ====================
  fiscalProcesses: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await db.getFiscalProcessesByCompanyId(input.companyId);
      }),

    list: protectedProcedure
      .input(z.object({
        processType: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        if (input.processType && input.processType !== "all") {
          return await db.getFiscalProcessesByType(ctx.user.id, input.processType);
        }
        return await db.getAllFiscalProcesses(ctx.user.id);
      }),

    listByType: protectedProcedure
      .input(z.object({
        processType: z.enum(["simples_nacional", "dctfweb", "fgts", "parcelamentos", "situacao_fiscal", "caixas_postais", "declaracoes"])
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
        processType: z.enum(["simples_nacional", "dctfweb", "fgts", "parcelamentos", "situacao_fiscal", "caixas_postais", "declaracoes"]),
        referenceMonth: z.number().optional(),
        referenceYear: z.number(),
        status: z.enum(["em_dia", "pendente", "atencao"]).optional(),
        dueDate: z.date().optional(),
        completedDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createFiscalProcess({
          ...input,
          processType: input.processType as any,
        });
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

    listByRegime: protectedProcedure
      .input(z.object({ taxRegime: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getFiscalProcessesByTaxRegime(ctx.user.id, input.taxRegime);
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
        declarationType: z.enum(["dctfweb", "defis", "darfsimples", "das_simples_nacional", "pgdasd", "pf_pj", "rais", "gfip_sefip", "icms_ies", "demais_especies"])
      }))
      .query(async ({ ctx, input }) => {
        return await db.getDeclarationsByType(ctx.user.id, input.declarationType);
      }),

    getStats: protectedProcedure
      .input(z.object({
        declarationType: z.enum(["dctfweb", "defis", "darfsimples", "das_simples_nacional", "pgdasd", "pf_pj", "rais", "gfip_sefip", "icms_ies", "demais_especies"])
      }))
      .query(async ({ ctx, input }) => {
        return await db.getDeclarationStats(ctx.user.id, input.declarationType);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.string().uuid(),
        declarationType: z.enum(["dctfweb", "defis", "darfsimples", "das_simples_nacional", "pgdasd", "pf_pj", "rais", "gfip_sefip", "icms_ies", "demais_especies"]),
        referenceMonth: z.number().optional(),
        referenceYear: z.number(),
        declared: z.boolean().optional(),
        declarationDate: z.date().optional(),
        protocolNumber: z.string().optional(),
        period: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { ...data } = input;
        return await db.createDeclaration({
          ...data,
          protocol: (input as any).protocolNumber // Handle mapping if needed
        });
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

    listByRegime: protectedProcedure
      .input(z.object({ taxRegime: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getDeclarationsByTaxRegime(ctx.user.id, input.taxRegime);
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
        rbt12Value: z.string(),
        sublimit: z.string(),
        percentageUsed: z.string().optional(),
        alert: z.boolean().optional(),
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
          processType: input.processType as any,
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
        reportType: z.enum(["mensal", "trimestral", "anual"]),
        period: z.string(), // YYYY-MM
        reportContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createFiscalReport({
          companyId: input.companyId,
          reportType: input.reportType,
          period: input.period,
          content: input.reportContent,
        });
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
        time: z.string(),
        processType: z.enum(["simples_nacional", "dctfweb", "fgts", "parcelamentos", "situacao_fiscal", "caixas_postais", "declaracoes"]),
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

  // ==================== API ERROR HELPERS ====================
  // Traduz códigos de erro da API InfoSimples para mensagens amigáveis
  // Ref: https://infosimples.com/consultas/api/docs#error-codes

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

        const { consultarCNDFederal, isValidCNPJ, parseBrazilianDate, getIsDev } = await import("./infosimples");

        let documento = company.cnpj || company.cpf || "";

        // Validate that the company actually has a document number
        if (!documento || documento.replace(/\D/g, "").length < 11) {
          const errMsg = "Empresa não possui CNPJ ou CPF cadastrado. Cadastre o documento antes de consultar.";
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_federal",
            sucesso: false,
            mensagemErro: errMsg,
            situacao: "DADO AUSENTE",
            respostaCompleta: JSON.stringify({ error: errMsg, documento }),
          });
          return { sucesso: false, mensagem: errMsg, situacao: "DADO AUSENTE" };
        }

        // Auto-pad CNPJ se tiver 13 dígitos
        if (company.personType === "juridica" && documento.replace(/\D/g, "").length === 13) {
          documento = "0" + documento.replace(/\D/g, "");
        }

        const isCnpj = (documento.replace(/\D/g, "").length || 0) >= 14;

        // Validação local antes de gastar crédito ou dar erro 607 (Relaxado em Dev)
        if (isCnpj && !isValidCNPJ(documento) && !getIsDev()) {
          const errMsg = "CNPJ estruturalmente inválido (falha no dígito verificador)";
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_federal",
            sucesso: false,
            mensagemErro: errMsg,
            situacao: "DADO INVÁLIDO",
            respostaCompleta: JSON.stringify({ error: errMsg, cnpj: documento }),
          });
          return { sucesso: false, mensagem: errMsg, situacao: "DADO INVÁLIDO" };
        }

        try {
          // Prioriza certificado da tabela digitalCertificates
          const activeCert = await db.getActiveCertificateForCompany(input.companyId);
          let certPath = activeCert?.path || company.certificatePath || undefined;
          let certPass = activeCert?.passwordHash || company.certificatePasswordHash || undefined;

          // Only use certificate if it looks like real base64 data (not test placeholders)
          if (certPath && (certPath.length < 100 || certPath === 'test_path')) {
            console.log(`[CND Federal] Skipping invalid/test certificate data for ${company.name}`);
            certPath = undefined;
            certPass = undefined;
          }

          console.log(`[CND Federal] Iniciando consulta para ${documento} (Cert: ${certPath ? 'Sim' : 'Não'})`);

          // Passa data de nascimento se for Pessoa Física
          const resultado = await consultarCNDFederal(
            documento,
            company.personType === "fisica" && company.dataNascimento ? company.dataNascimento : undefined,
            "nova",
            certPath,
            certPass
          );

          console.log(`[CND Federal] Resultado bruto code: ${resultado.code}`);
          const data = Array.isArray(resultado.data) ? resultado.data[0] : resultado.data;

          // Mapeamento ainda mais robusto
          const situacao = data?.situacao || data?.mensagem || (data?.conseguiu_emitir_certidao_negativa ? "REGULAR" : undefined) || resultado.code_message || "DESCONHECIDO";
          const numeroCertidao = data?.numero_certidao || data?.certidao_codigo || data?.numero_protocolo;
          const dataEmissao = data?.data_emissao || data?.emissao_data;
          const dataValidade = data?.data_validade || data?.validade;
          const siteReceipt = data?.site_receipt || (resultado.site_receipts && resultado.site_receipts[0]);

          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_federal",
            situacao: situacao,
            numeroCertidao: numeroCertidao,
            dataEmissao: parseBrazilianDate(dataEmissao),
            dataValidade: parseBrazilianDate(dataValidade),
            siteReceipt: siteReceipt,
            respostaCompleta: JSON.stringify(resultado),
            sucesso: resultado.code === 200,
            mensagemErro: resultado.code !== 200 ? resultado.code_message : undefined,
          });

          return {
            sucesso: resultado.code === 200,
            situacao: situacao,
            numeroCertidao: numeroCertidao,
            dataEmissao: dataEmissao,
            dataValidade: dataValidade,
            siteReceipt: siteReceipt,
            mensagem: resultado.code !== 200
              ? `${friendlyApiMessage(resultado.code, resultado.code_message)}${getApiErrorDetails(resultado) ? ' [Motivo: ' + getApiErrorDetails(resultado) + ']' : ''}`
              : undefined,
            respostaCompleta: JSON.stringify(resultado),
          };
        } catch (error: any) {
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_federal",
            sucesso: false,
            mensagemErro: error.message,
            situacao: "ERRO",
            respostaCompleta: JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }),
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

        if (!company.inscricaoEstadual && !company.cnpj) {
          throw new Error("Empresa não possui Inscrição Estadual nem CNPJ cadastrado para consulta");
        }

        const { consultarCNDEstadual, isValidCNPJ, parseBrazilianDate, getIsDev } = await import("./infosimples");

        let cnpj = company.cnpj;
        if (cnpj && cnpj.replace(/\D/g, "").length === 13) {
          cnpj = "0" + cnpj.replace(/\D/g, "");
        }

        // Validação local (Relaxado em Dev)
        if (cnpj && !isValidCNPJ(cnpj) && !getIsDev()) {
          const errMsg = "CNPJ estruturalmente inválido para consulta estadual";
          return { sucesso: false, mensagem: errMsg, situacao: "DADO INVÁLIDO" };
        }

        try {
          const activeCert = await db.getActiveCertificateForCompany(input.companyId);
          let certPath = activeCert?.path || company.certificatePath || undefined;
          let certPass = activeCert?.passwordHash || company.certificatePasswordHash || undefined;

          // Only use certificate if it looks like real base64 data
          if (certPath && (certPath.length < 100 || certPath === 'test_path')) {
            console.log(`[CND Estadual] Skipping invalid/test certificate data for ${company.name}`);
            certPath = undefined;
            certPass = undefined;
          }

          const uf = company.uf || "PR";
          console.log(`[CND Estadual] Iniciando consulta para ${company.inscricaoEstadual} (${uf})`);

          const resultado = await consultarCNDEstadual(
            company.inscricaoEstadual || undefined,
            company.uf || "PR",
            company.cnpj || undefined,
            certPath,
            certPass
          );

          console.log(`[CND Estadual] Resultado bruto code: ${resultado.code}`);
          const data = Array.isArray(resultado.data) ? resultado.data[0] : resultado.data;
          const situacao = data?.situacao || data?.mensagem || resultado.code_message || "DESCONHECIDO";
          const numeroCertidao = data?.numero_certidao || data?.numero_protocolo || data?.id_consulta;
          const siteReceipt = data?.site_receipt || (resultado.site_receipts && resultado.site_receipts[0]);

          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_estadual",
            situacao: situacao,
            numeroCertidao: numeroCertidao,
            dataEmissao: parseBrazilianDate(data?.data_emissao),
            dataValidade: parseBrazilianDate(data?.data_validade),
            siteReceipt: siteReceipt,
            respostaCompleta: JSON.stringify(resultado),
            sucesso: resultado.code === 200,
            mensagemErro: resultado.code !== 200 ? resultado.code_message : undefined,
          });

          return {
            sucesso: resultado.code === 200,
            situacao: situacao,
            numeroCertidao: numeroCertidao,
            dataEmissao: data?.data_emissao,
            dataValidade: data?.data_validade,
            siteReceipt: siteReceipt,
            mensagem: resultado.code !== 200
              ? `${friendlyApiMessage(resultado.code, resultado.code_message)}${getApiErrorDetails(resultado) ? ' [Motivo: ' + getApiErrorDetails(resultado) + ']' : ''}`
              : undefined,
            respostaCompleta: JSON.stringify(resultado),
          };
        } catch (error: any) {
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "cnd_estadual",
            sucesso: false,
            mensagemErro: error.message,
            situacao: "ERRO",
            respostaCompleta: JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }),
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

        const { consultarRegularidadeFGTS, isValidCNPJ, parseBrazilianDate, getIsDev } = await import("./infosimples");

        let cnpj = company.cnpj;
        if (cnpj && cnpj.replace(/\D/g, "").length === 13) {
          cnpj = "0" + cnpj.replace(/\D/g, "");
        }

        // Validação local (Relaxado em Dev)
        if (cnpj && !isValidCNPJ(cnpj) && !getIsDev()) {
          const errMsg = "CNPJ estruturalmente inválido para consulta FGTS";
          return { sucesso: false, mensagem: errMsg, situacao: "DADO INVÁLIDO" };
        }

        try {
          const activeCert = await db.getActiveCertificateForCompany(input.companyId);
          let certPath = activeCert?.path || company.certificatePath || undefined;
          let certPass = activeCert?.passwordHash || company.certificatePasswordHash || undefined;

          // Only use certificate if it looks like real base64 data
          if (certPath && (certPath.length < 100 || certPath === 'test_path')) {
            console.log(`[FGTS] Skipping invalid/test certificate data for ${company.name}`);
            certPath = undefined;
            certPass = undefined;
          }

          // Validate CNPJ exists
          if (!company.cnpj || company.cnpj.replace(/\D/g, "").length < 14) {
            return { sucesso: false, mensagem: "Empresa não possui CNPJ cadastrado.", situacao: "DADO AUSENTE" };
          }

          console.log(`[Regularidade FGTS] Iniciando consulta para ${company.cnpj}`);

          const resultado = await consultarRegularidadeFGTS(
            company.cnpj,
            certPath,
            certPass
          );

          console.log(`[Regularidade FGTS] Resultado bruto code: ${resultado.code}`);
          const data = Array.isArray(resultado.data) ? resultado.data[0] : resultado.data;
          const situacao = data?.situacao || data?.status || resultado.code_message || "DESCONHECIDO";
          const numeroCertidao = data?.numero_crf || data?.certidao_numero || data?.inscricao;
          const siteReceipt = data?.site_receipt || (resultado.site_receipts && resultado.site_receipts[0]);

          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "regularidade_fgts",
            situacao: situacao,
            numeroCertidao: numeroCertidao,
            dataEmissao: parseBrazilianDate(data?.data_emissao),
            dataValidade: parseBrazilianDate(data?.data_validade),
            siteReceipt: siteReceipt,
            respostaCompleta: JSON.stringify(resultado),
            sucesso: resultado.code === 200,
            mensagemErro: resultado.code !== 200 ? resultado.code_message : undefined,
          });

          return {
            sucesso: resultado.code === 200,
            situacao: situacao,
            numeroCertidao: numeroCertidao,
            dataEmissao: data?.data_emissao,
            dataValidade: data?.data_validade,
            siteReceipt: siteReceipt,
            mensagem: resultado.code !== 200
              ? `${friendlyApiMessage(resultado.code, resultado.code_message)}${getApiErrorDetails(resultado) ? ' [Motivo: ' + getApiErrorDetails(resultado) + ']' : ''}`
              : undefined,
            respostaCompleta: JSON.stringify(resultado),
          };
        } catch (error: any) {
          await db.createApiConsulta({
            companyId: input.companyId,
            userId: ctx.user.id,
            tipoConsulta: "regularidade_fgts",
            sucesso: false,
            mensagemErro: error.message,
            situacao: "ERRO",
            respostaCompleta: JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }),
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
          const activeCert = await db.getActiveCertificateForCompany(input.companyId);
          const certPath = activeCert?.path || company.certificatePath || undefined;
          const certPass = activeCert?.passwordHash || company.certificatePasswordHash || "Dc4q2T@p9PYQj@2@";

          const resultado = await consultarCaixaPostalECAC(
            company.cnpj || "",
            certPath,
            certPass
          );

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
            respostaCompleta: JSON.stringify(resultado),
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

    listAll: protectedProcedure.query(async ({ ctx }) => {
      // Need a global pendency query in db.ts? Let's check.
      return await db.getPendenciesByUserId(ctx.user.id);
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
