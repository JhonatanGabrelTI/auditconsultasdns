console.log("[Database] Loaded CHECKPOINT-DB-V3");
import { eq, and, like, or, desc, sql, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  users,
  companies,
  digitalCertificates,
  procuracoes,
  fiscalProcesses,
  declarations,
  rbt12Sublimits,
  ecacMessages,
  notifications,
  fiscalReports,
  settings,
  schedules,
  apiConsultas,
  executionLogs,
  pendencies
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Types inferred from schema
type InsertUser = typeof users.$inferInsert;
type InsertCompany = typeof companies.$inferInsert;
type Company = typeof companies.$inferSelect;
type InsertDigitalCertificate = typeof digitalCertificates.$inferInsert;
type DigitalCertificate = typeof digitalCertificates.$inferSelect;
type InsertProcuracao = typeof procuracoes.$inferInsert;
type Procuracao = typeof procuracoes.$inferSelect;
type InsertFiscalProcess = typeof fiscalProcesses.$inferInsert;
type FiscalProcess = typeof fiscalProcesses.$inferSelect;
type InsertDeclaration = typeof declarations.$inferInsert;
type Declaration = typeof declarations.$inferSelect;
type InsertRbt12Sublimit = typeof rbt12Sublimits.$inferInsert;
type Rbt12Sublimit = typeof rbt12Sublimits.$inferSelect;
type InsertEcacMessage = typeof ecacMessages.$inferInsert;
type EcacMessage = typeof ecacMessages.$inferSelect;
type InsertNotification = typeof notifications.$inferInsert;
type Notification = typeof notifications.$inferSelect;
type InsertFiscalReport = typeof fiscalReports.$inferInsert;
type FiscalReport = typeof fiscalReports.$inferSelect;
type InsertSettings = typeof settings.$inferInsert;
type Settings = typeof settings.$inferSelect;
type InsertSchedule = typeof schedules.$inferInsert;
type Schedule = typeof schedules.$inferSelect;
type InsertApiConsulta = typeof apiConsultas.$inferInsert;
type ApiConsulta = typeof apiConsultas.$inferSelect;
type InsertExecutionLog = typeof executionLogs.$inferInsert;
type ExecutionLog = typeof executionLogs.$inferSelect;
type InsertPendency = typeof pendencies.$inferInsert;
type Pendency = typeof pendencies.$inferSelect;

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const isLocal = process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1");
      _client = postgres(process.env.DATABASE_URL, {
        prepare: false, // Importante para Supabase
        ssl: isLocal ? false : 'require',
      });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER OPERATIONS ====================

export async function upsertUser(user: InsertUser): Promise<typeof users.$inferSelect | undefined> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    const result = await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    }).returning();
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== COMPANY OPERATIONS ====================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function createCompany(company: InsertCompany) {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Connection not available");
    throw new Error("Database connection not available. Please check your DATABASE_URL configuration.");
  }

  try {
    // Deixar o banco gerar o UUID se não houver id, ou usar o fornecido
    const data = {
      ...company,
      emails: Array.isArray(company.emails) ? company.emails : [],
      whatsapps: Array.isArray(company.whatsapps) ? company.whatsapps : [],
    };

    console.log("[Database] Inserting company...");
    const result = await db.insert(companies).values(data as any).returning();
    console.log("[Database] Insert successful:", result[0]?.id);
    return result[0];
  } catch (error: any) {
    console.error("[Database] Insert error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Postgres.js error properties
    const code = error.code || error.severity;
    const detail = error.detail || "";
    const hint = error.hint || "";
    const message = error.message || "";

    console.error("[Database] Parsed details - Code:", code, "Detail:", detail, "Hint:", hint);

    let userMessage = message;
    if (code === '23503') {
      userMessage = "O usuário associado não existe no banco (erro interno).";
    } else if (code === '23505') {
      if (detail.includes('cnpj')) {
        userMessage = "Este CNPJ já está cadastrado em outro cliente.";
      } else if (detail.includes('cpf')) {
        userMessage = "Este CPF já está cadastrado em outro cliente.";
      } else {
        userMessage = "Já existe um registro com estes dados únicos.";
      }
    }

    throw new Error(`[DB-ERR-${code || 'UNK'}]: ${userMessage} ${detail ? '(' + detail + ')' : ''}`);
  }
}

export async function bulkCreateCompanies(companiesData: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available.");

  try {
    const dataToInsert = companiesData.map(c => ({
      id: generateUUID(),
      ...c,
      emails: Array.isArray(c.emails) ? c.emails : [],
      whatsapps: Array.isArray(c.whatsapps) ? c.whatsapps : [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await db.insert(companies).values(dataToInsert as any).returning();
    return result;
  } catch (error: any) {
    console.error("[Database] Bulk insert error:", error);
    throw new Error(`[DB-ERR-BULK]: Falha ao importar clientes em lote. Verifique se há CNPJs duplicados. (${error.message})`);
  }
}

export async function getCompaniesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(companies).where(eq(companies.userId, userId)).orderBy(desc(companies.createdAt));
}

export async function getCompanyById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCompany(id: string, data: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(companies).set(data).where(eq(companies.id, id));
}

export async function deleteCompany(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(companies).where(eq(companies.id, id));
}

export async function searchCompanies(userId: number, searchTerm?: string, filters?: {
  taxRegime?: string;
  personType?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(companies).where(eq(companies.userId, userId));

  const conditions = [eq(companies.userId, userId)];

  if (searchTerm) {
    conditions.push(
      or(
        like(companies.name, `%${searchTerm}%`),
        like(companies.cnpj, `%${searchTerm}%`)
      )!
    );
  }

  if (filters?.taxRegime) {
    conditions.push(eq(companies.taxRegime, filters.taxRegime as any));
  }

  if (filters?.personType) {
    conditions.push(eq(companies.personType, filters.personType as any));
  }

  return await db.select().from(companies).where(and(...conditions)).orderBy(desc(companies.createdAt));
}

// ==================== DIGITAL CERTIFICATE OPERATIONS ====================

export async function createDigitalCertificate(certificate: InsertDigitalCertificate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(digitalCertificates).values(certificate).returning();
}

export async function getDigitalCertificatesByCompanyId(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(digitalCertificates).where(eq(digitalCertificates.companyId, companyId));
}

export async function updateDigitalCertificate(id: number, data: Partial<InsertDigitalCertificate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(digitalCertificates).set(data).where(eq(digitalCertificates.id, id));
}

export async function deleteDigitalCertificate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(digitalCertificates).where(eq(digitalCertificates.id, id));
}

export async function getDigitalCertificatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get explicit certificates from digitalCertificates table
  const explicitCerts = await db
    .select({
      certificate: digitalCertificates,
      company: companies
    })
    .from(digitalCertificates)
    .innerJoin(companies, eq(digitalCertificates.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(desc(digitalCertificates.validUntil));

  const explicitIds = new Set(explicitCerts.map(c => c.company.id));

  // Get implicit certificates from companies table that aren't in digitalCertificates
  const implicitCerts = await db
    .select()
    .from(companies)
    .where(and(
      eq(companies.userId, userId),
      isNotNull(companies.certificatePath)
    ));

  const results = [...explicitCerts];

  implicitCerts.forEach(company => {
    if (!explicitIds.has(company.id)) {
      results.push({
        certificate: {
          id: 0, // Virtual ID
          companyId: company.id,
          name: "Certificado (Auto)",
          serialNumber: null,
          issuer: null,
          subject: null,
          validFrom: null,
          validUntil: company.certificateExpiresAt,
          path: company.certificatePath,
          passwordHash: company.certificatePasswordHash,
          active: true,
          createdAt: company.createdAt,
          updatedAt: company.createdAt
        } as any,
        company: company
      });
    }
  });

  return results;
}

export async function getActiveCertificateForCompany(companyId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(digitalCertificates)
    .where(and(
      eq(digitalCertificates.companyId, companyId),
      eq(digitalCertificates.active, true)
    ))
    .orderBy(desc(digitalCertificates.validUntil), desc(digitalCertificates.id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== PROCURACAO OPERATIONS ====================

export async function createProcuracao(procuracao: InsertProcuracao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(procuracoes).values(procuracao);
}

export async function getProcuracoesByCompanyId(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(procuracoes).where(eq(procuracoes.companyId, companyId));
}

export async function updateProcuracao(id: number, data: Partial<InsertProcuracao>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(procuracoes).set(data).where(eq(procuracoes.id, id));
}

export async function deleteProcuracao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(procuracoes).where(eq(procuracoes.id, id));
}

export async function getProcuracoesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      procuracao: procuracoes,
      company: companies
    })
    .from(procuracoes)
    .innerJoin(companies, eq(procuracoes.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(desc(procuracoes.endDate));
}

// ==================== FISCAL PROCESS OPERATIONS ====================

export async function createFiscalProcess(process: InsertFiscalProcess) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(fiscalProcesses).values(process);
}

export async function getFiscalProcessesByCompanyId(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(fiscalProcesses).where(eq(fiscalProcesses.companyId, companyId)).orderBy(desc(fiscalProcesses.createdAt));
}

export async function getAllFiscalProcesses(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      process: fiscalProcesses,
      company: companies
    })
    .from(fiscalProcesses)
    .innerJoin(companies, eq(fiscalProcesses.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(desc(fiscalProcesses.createdAt));
}

export async function getFiscalProcessesByType(userId: number, processType: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      process: fiscalProcesses,
      company: companies
    })
    .from(fiscalProcesses)
    .innerJoin(companies, eq(fiscalProcesses.companyId, companies.id))
    .where(and(
      eq(companies.userId, userId),
      eq(fiscalProcesses.processType, processType as any)
    ))
    .orderBy(desc(fiscalProcesses.createdAt));
}

export async function getFiscalProcessesByTaxRegime(userId: number, taxRegime: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      process: fiscalProcesses,
      company: companies
    })
    .from(fiscalProcesses)
    .innerJoin(companies, eq(fiscalProcesses.companyId, companies.id))
    .where(and(
      eq(companies.userId, userId),
      eq(companies.taxRegime, taxRegime as any)
    ))
    .orderBy(desc(fiscalProcesses.createdAt));
}

export async function updateFiscalProcess(id: number, data: Partial<InsertFiscalProcess>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(fiscalProcesses).set(data).where(eq(fiscalProcesses.id, id));
}

export async function getFiscalProcessStats(userId: number) {
  const db = await getDb();
  if (!db) return { emDia: 0, pendente: 0, atencao: 0 };

  const result = await db
    .select({
      status: fiscalProcesses.status,
      count: sql<number>`count(*)`.as('count')
    })
    .from(fiscalProcesses)
    .innerJoin(companies, eq(fiscalProcesses.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .groupBy(fiscalProcesses.status);

  const stats = { emDia: 0, pendente: 0, atencao: 0 };
  result.forEach(row => {
    if (row.status === 'em_dia') stats.emDia = Number(row.count);
    if (row.status === 'pendente') stats.pendente = Number(row.count);
    if (row.status === 'atencao') stats.atencao = Number(row.count);
  });

  return stats;
}

// ==================== DECLARATION OPERATIONS ====================

export async function createDeclaration(declaration: InsertDeclaration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(declarations).values(declaration);
}

export async function getDeclarationsByCompanyId(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(declarations).where(eq(declarations.companyId, companyId)).orderBy(desc(declarations.createdAt));
}

export async function getDeclarationsByType(userId: number, declarationType: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      declaration: declarations,
      company: companies
    })
    .from(declarations)
    .innerJoin(companies, eq(declarations.companyId, companies.id))
    .where(and(
      eq(companies.userId, userId),
      eq(declarations.declarationType, declarationType as any)
    ))
    .orderBy(desc(declarations.createdAt));
}

export async function getDeclarationsByTaxRegime(userId: number, taxRegime: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      declaration: declarations,
      company: companies
    })
    .from(declarations)
    .innerJoin(companies, eq(declarations.companyId, companies.id))
    .where(and(
      eq(companies.userId, userId),
      eq(companies.taxRegime, taxRegime as any)
    ))
    .orderBy(desc(declarations.createdAt));
}

export async function updateDeclaration(id: number, data: Partial<InsertDeclaration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(declarations).set(data).where(eq(declarations.id, id));
}

export async function getDeclarationStats(userId: number, declarationType: string) {
  const db = await getDb();
  if (!db) return { total: 0, declared: 0 };

  const result = await db
    .select({
      declared: declarations.declared,
      count: sql<number>`count(*)`.as('count')
    })
    .from(declarations)
    .innerJoin(companies, eq(declarations.companyId, companies.id))
    .where(and(
      eq(companies.userId, userId),
      eq(declarations.declarationType, declarationType as any)
    ))
    .groupBy(declarations.declared);

  let total = 0;
  let declared = 0;
  result.forEach(row => {
    const count = Number(row.count);
    total += count;
    if (row.declared) declared = count;
  });

  return { total, declared };
}

// ==================== RBT12 SUBLIMIT OPERATIONS ====================

export async function createRbt12Sublimit(sublimit: InsertRbt12Sublimit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(rbt12Sublimits).values(sublimit);
}

export async function getRbt12SublimitsByUserId(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      sublimit: rbt12Sublimits,
      company: companies
    })
    .from(rbt12Sublimits)
    .innerJoin(companies, eq(rbt12Sublimits.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(desc(rbt12Sublimits.rbt12Value))
    .limit(limit);
}

// ==================== E-CAC MESSAGE OPERATIONS ====================

export async function createEcacMessage(message: InsertEcacMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(ecacMessages).values(message);
}

export async function getEcacMessagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      message: ecacMessages,
      company: companies
    })
    .from(ecacMessages)
    .innerJoin(companies, eq(ecacMessages.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(desc(ecacMessages.messageDate));
}

export async function markEcacMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(ecacMessages).set({ read: true }).where(eq(ecacMessages.id, id));
}

// ==================== NOTIFICATION OPERATIONS ====================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notifications).values(notification);
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function searchNotifications(userId: number, searchTerm: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        or(
          like(notifications.title, `%${searchTerm}%`),
          like(notifications.description, `%${searchTerm}%`),
          like(notifications.processType, `%${searchTerm}%`)
        )
      )
    )
    .orderBy(desc(notifications.createdAt));
}

// ==================== FISCAL REPORT OPERATIONS ====================

export async function createFiscalReport(report: InsertFiscalReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(fiscalReports).values(report);
}

export async function getFiscalReportsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      report: fiscalReports,
      company: companies
    })
    .from(fiscalReports)
    .innerJoin(companies, eq(fiscalReports.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(desc(fiscalReports.generatedAt));
}

// ==================== SETTINGS OPERATIONS ====================

export async function getSettingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSettings(userId: number, data: Partial<InsertSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getSettingsByUserId(userId);

  if (existing) {
    return await db.update(settings).set(data).where(eq(settings.userId, userId));
  } else {
    return await db.insert(settings).values({ userId, ...data });
  }
}

// ==================== SCHEDULE OPERATIONS ====================

export async function createSchedule(schedule: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(schedules).values(schedule);
}

export async function getSchedulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schedules).where(eq(schedules.userId, userId)).orderBy(schedules.dayOfMonth);
}

export async function updateSchedule(id: number, data: Partial<InsertSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(schedules).set(data).where(eq(schedules.id, id));
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(schedules).where(eq(schedules.id, id));
}

// ==================== API CONSULTAS ====================

export async function createApiConsulta(consulta: InsertApiConsulta): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(apiConsultas).values(consulta);
  } catch (error: any) {
    console.error("[Database] createApiConsulta error:", error);
    console.error("[Database] Error detail:", error.detail, error.hint, error.code);
    throw new Error(`Failed to save consulta: ${error.detail || error.message}`);
  }
}

export async function getApiConsultasByCompany(companyId: string): Promise<ApiConsulta[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(apiConsultas).where(eq(apiConsultas.companyId, companyId)).orderBy(desc(apiConsultas.createdAt));
}

export async function getApiConsultasByUser(userId: number): Promise<ApiConsulta[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(apiConsultas).where(eq(apiConsultas.userId, userId)).orderBy(desc(apiConsultas.createdAt));
}

export async function getLatestApiConsulta(
  companyId: string,
  tipoConsulta: "cnd_federal" | "cnd_estadual" | "regularidade_fgts"
): Promise<ApiConsulta | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db
    .select()
    .from(apiConsultas)
    .where(and(eq(apiConsultas.companyId, companyId), eq(apiConsultas.tipoConsulta, tipoConsulta)))
    .orderBy(desc(apiConsultas.createdAt))
    .limit(1);
  return results[0];
}

// ==================== EXECUTION LOGS ====================

export async function createExecutionLog(log: InsertExecutionLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(executionLogs).values(log);
}

export async function getExecutionLogsByCompanyId(companyId: string): Promise<ExecutionLog[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(executionLogs).where(eq(executionLogs.companyId, companyId)).orderBy(desc(executionLogs.createdAt));
}

// ==================== PENDENCIES ====================

export async function createPendency(pendency: InsertPendency): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(pendencies).values(pendency);
}

export async function getPendenciesByCompanyId(companyId: string): Promise<Pendency[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pendencies).where(eq(pendencies.companyId, companyId)).orderBy(desc(pendencies.detectedAt));
}

export async function getPendenciesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      pendency: pendencies,
      company: companies
    })
    .from(pendencies)
    .innerJoin(companies, eq(pendencies.companyId, companies.id))
    .where(eq(companies.userId, userId))
    .orderBy(desc(pendencies.detectedAt));
}
