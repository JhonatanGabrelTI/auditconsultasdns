import { pgTable, text, serial, timestamp, boolean, integer, uuid, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Companies (formerly Clients) - Pessoas Jurídicas e Físicas
 */
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("userId").notNull().references(() => users.id), // Relacionamento com usuário

  // Tipo de pessoa
  personType: text("personType", { enum: ["juridica", "fisica"] }).notNull(),

  // Dados principais
  name: text("name").notNull(), // Razão Social ou Nome
  cnpj: varchar("cnpj", { length: 14 }).unique(), // CNPJ
  cpf: varchar("cpf", { length: 11 }), // CPF separate 

  // Dados fiscais
  taxRegime: text("taxRegime", {
    enum: [
      "simples_nacional",
      "lucro_presumido",
      "lucro_real",
      "mei",
      "isento"
    ]
  }),

  accessCode: text("accessCode"), // Cód acesso Simples
  certificatePath: text("certificatePath"),
  certificatePasswordHash: text("certificatePasswordHash"),
  certificateExpiresAt: timestamp("certificateExpiresAt"),

  // Legacy fields tailored to new naming
  inscricaoEstadual: text("inscricaoEstadual"),
  dataNascimento: text("dataNascimento"), // formato: aaaa-mm-dd

  // Contatos (armazenados como JSON)
  emails: jsonb("emails"), // JSON array de emails
  whatsapps: jsonb("whatsapps"), // JSON array de whatsapps

  // Status
  active: boolean("active").default(true).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Execution Logs (Auditoria)
 */
export const executionLogs = pgTable("execution_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id),
  serviceType: text("serviceType", { enum: ['ECAC', 'SIMPLES', 'FGTS'] }),
  status: text("status", { enum: ['SUCCESS', 'ERROR', 'PENDING'] }),
  resultSummary: jsonb("resultSummary"), // Ex: { "pendencias": 3, "mensagens": 0 }
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = typeof executionLogs.$inferInsert;

/**
 * Pendencies (Pendências Encontradas)
 */
export const pendencies = pgTable("pendencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id),
  source: text("source", { enum: ['RECEITA', 'DIVIDA_ATIVA'] }),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }), // Valor do débito 
  detectedAt: timestamp("detectedAt").defaultNow(),
  resolvedAt: timestamp("resolvedAt"), // Null se ainda estiver pendente
});

export type Pendency = typeof pendencies.$inferSelect;
export type InsertPendency = typeof pendencies.$inferInsert;

/**
 * Digital Certificates
 */
export const digitalCertificates = pgTable("digitalCertificates", {
  id: serial("id").primaryKey(),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  name: text("name").notNull(),
  serialNumber: text("serialNumber"),
  issuer: text("issuer"),
  subject: text("subject"),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  path: text("path"),
  passwordHash: text("passwordHash"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type DigitalCertificate = typeof digitalCertificates.$inferSelect;
export type InsertDigitalCertificate = typeof digitalCertificates.$inferInsert;

/**
 * Procurações (Poderes)
 */
export const procuracoes = pgTable("procuracoes", {
  id: serial("id").primaryKey(),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  type: text("type", { enum: ["ecac", "simples_nacional", "outros"] }).default("ecac").notNull(),
  cpfRepresentante: varchar("cpfRepresentante", { length: 14 }).notNull(),
  nomeRepresentante: text("nomeRepresentante").notNull(),
  active: boolean("active").default(true).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Procuracao = typeof procuracoes.$inferSelect;
export type InsertProcuracao = typeof procuracoes.$inferInsert;

/**
 * Fiscal Processes (Processos Fiscais)
 */
export const fiscalProcesses = pgTable("fiscalProcesses", {
  id: serial("id").primaryKey(),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  processType: text("processType", {
    enum: [
      "simples_nacional",
      "dctfweb",
      "fgts",
      "parcelamentos",
      "situacao_fiscal",
      "caixas_postais",
      "declaracoes"
    ]
  }).notNull(),
  status: text("status", { enum: ["em_dia", "pendente", "atencao"] }).default("em_dia").notNull(),
  referenceYear: integer("referenceYear"),
  referenceMonth: integer("referenceMonth"),
  notes: text("notes"),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type FiscalProcess = typeof fiscalProcesses.$inferSelect;
export type InsertFiscalProcess = typeof fiscalProcesses.$inferInsert;

/**
 * Declarations (Declarações)
 */
export const declarations = pgTable("declarations", {
  id: serial("id").primaryKey(),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  declarationType: text("declarationType", {
    enum: [
      "dctfweb",
      "defis",
      "darfsimples",
      "das_simples_nacional",
      "pgdasd",
      "pf_pj",
      "rais",
      "gfip_sefip",
      "icms_ies",
      "demais_especies"
    ]
  }).notNull(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  declared: boolean("declared").default(false).notNull(),
  declarationDate: timestamp("declarationDate"),
  protocol: text("protocol"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Declaration = typeof declarations.$inferSelect;
export type InsertDeclaration = typeof declarations.$inferInsert;

/**
 * RBT12 Sublimits (Alertas Sublimite)
 */
export const rbt12Sublimits = pgTable("rbt12Sublimits", {
  id: serial("id").primaryKey(),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  rbt12Value: varchar("rbt12Value", { length: 20 }).notNull(),
  sublimit: varchar("sublimit", { length: 20 }).notNull(),
  percentageUsed: varchar("percentageUsed", { length: 10 }),
  alert: boolean("alert").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Rbt12Sublimit = typeof rbt12Sublimits.$inferSelect;
export type InsertRbt12Sublimit = typeof rbt12Sublimits.$inferInsert;

/**
 * E-CAC Messages (Mensagens)
 */
export const ecacMessages = pgTable("ecacMessages", {
  id: serial("id").primaryKey(),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  messageType: text("messageType", { enum: ["ecac", "simples_nacional", "fazenda"] }).notNull(),
  subject: text("subject").notNull(),
  content: text("content"),
  messageDate: timestamp("messageDate"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EcacMessage = typeof ecacMessages.$inferSelect;
export type InsertEcacMessage = typeof ecacMessages.$inferInsert;

/**
 * Notifications (Notificações)
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  processType: text("processType", {
    enum: [
      "simples_nacional",
      "dctfweb",
      "fgts",
      "parcelamentos",
      "situacao_fiscal",
      "caixas_postais",
      "declaracoes",
      "alertas"
    ]
  }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Fiscal Reports (Relatórios Fiscais)
 */
export const fiscalReports = pgTable("fiscalReports", {
  id: serial("id").primaryKey(),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  reportType: text("reportType", { enum: ["mensal", "trimestral", "anual"] }).notNull(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  content: text("content"), // JSON string
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type FiscalReport = typeof fiscalReports.$inferSelect;
export type InsertFiscalReport = typeof fiscalReports.$inferInsert;

/**
 * Settings (Configurações do Usuário)
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  numeroDisparo: text("numeroDisparo"),
  emailDisparo: text("emailDisparo"),
  certificadoDigitalId: integer("certificadoDigitalId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

/**
 * Schedules (Agendamentos)
 */
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  processType: text("processType", {
    enum: [
      "simples_nacional",
      "dctfweb",
      "fgts",
      "parcelamentos",
      "situacao_fiscal",
      "caixas_postais",
      "declaracoes"
    ]
  }).notNull(),
  dayOfMonth: integer("dayOfMonth").notNull(),
  time: varchar("time", { length: 5 }).notNull(), // HH:MM
  active: boolean("active").default(true).notNull(),
  lastRun: timestamp("lastRun"),
  nextRun: timestamp("nextRun"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * API Consultas (Registro de consultas às APIs externas)
 */
export const apiConsultas = pgTable("api_consultas", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  companyId: uuid("companyId").notNull().references(() => companies.id),
  tipoConsulta: text("tipoConsulta").notNull(),
  situacao: text("situacao"),
  numeroCertidao: text("numeroCertidao"),
  dataEmissao: timestamp("dataEmissao"),
  dataValidade: timestamp("dataValidade"),
  respostaCompleta: text("respostaCompleta"),
  sucesso: boolean("sucesso").default(false).notNull(),
  mensagemErro: text("mensagemErro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  validadeFim: timestamp("validadeFim"),
  siteReceipt: text("siteReceipt"),
});

export type ApiConsulta = typeof apiConsultas.$inferSelect;
export type InsertApiConsulta = typeof apiConsultas.$inferInsert;
