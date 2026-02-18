import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes - Pessoas Jurídicas e Físicas
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Relacionamento com usuário
  
  // Tipo de pessoa
  personType: mysqlEnum("personType", ["juridica", "fisica"]).notNull(),
  
  // Dados principais
  cnpjCpf: varchar("cnpjCpf", { length: 18 }).notNull(), // CNPJ ou CPF
  razaoSocialNome: text("razaoSocialNome").notNull(), // Razão Social ou Nome
  
  // Dados fiscais
  regimeTributario: mysqlEnum("regimeTributario", [
    "simples_nacional",
    "lucro_presumido",
    "lucro_real",
    "mei",
    "isento"
  ]),
  inscricaoEstadual: varchar("inscricaoEstadual", { length: 50 }),
  dataNascimento: varchar("dataNascimento", { length: 10 }), // formato: aaaa-mm-dd (para Pessoa Física)
  
  // Contatos (armazenados como JSON)
  emails: text("emails"), // JSON array de emails
  whatsapps: text("whatsapps"), // JSON array de whatsapps
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Certificados Digitais
 */
export const digitalCertificates = mysqlTable("digitalCertificates", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(), // Relacionamento com cliente
  
  // Dados do certificado
  certificateName: varchar("certificateName", { length: 255 }),
  issuer: varchar("issuer", { length: 255 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  
  // Datas
  issueDate: timestamp("issueDate"),
  expirationDate: timestamp("expirationDate").notNull(),
  
  // Status: integrado, a_vencer (30 dias), atencao (vencido ou < 15 dias)
  status: mysqlEnum("status", ["integrado", "a_vencer", "atencao"]).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DigitalCertificate = typeof digitalCertificates.$inferSelect;
export type InsertDigitalCertificate = typeof digitalCertificates.$inferInsert;

/**
 * Procurações
 */
export const procuracoes = mysqlTable("procuracoes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  
  // Dados da procuração
  tipo: varchar("tipo", { length: 100 }), // e-CAC, PGDAS, etc
  numero: varchar("numero", { length: 100 }),
  dataEmissao: timestamp("dataEmissao"),
  dataValidade: timestamp("dataValidade"),
  
  // Status
  status: mysqlEnum("status", ["ativa", "vencida", "revogada"]).default("ativa").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Procuracao = typeof procuracoes.$inferSelect;
export type InsertProcuracao = typeof procuracoes.$inferInsert;

/**
 * Processos Fiscais
 */
export const fiscalProcesses = mysqlTable("fiscalProcesses", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  
  // Tipo de processo
  processType: mysqlEnum("processType", [
    "pgdas",
    "pgmei",
    "dctfweb",
    "fgts_digital",
    "parcelamentos",
    "certidoes",
    "caixas_postais",
    "defis",
    "dirf"
  ]).notNull(),
  
  // Período de referência
  referenceMonth: int("referenceMonth"), // 1-12
  referenceYear: int("referenceYear").notNull(),
  
  // Status: em_dia, pendente, atencao
  status: mysqlEnum("status", ["em_dia", "pendente", "atencao"]).default("pendente").notNull(),
  
  // Dados adicionais
  dueDate: timestamp("dueDate"), // Data de vencimento
  completedDate: timestamp("completedDate"), // Data de conclusão
  
  // Observações
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FiscalProcess = typeof fiscalProcesses.$inferSelect;
export type InsertFiscalProcess = typeof fiscalProcesses.$inferInsert;

/**
 * Declarações
 */
export const declarations = mysqlTable("declarations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  processId: int("processId"), // Relacionamento opcional com processo
  
  // Tipo de declaração
  declarationType: mysqlEnum("declarationType", [
    "pgdas",
    "pgmei",
    "dctfweb",
    "fgts_digital",
    "defis",
    "dirf"
  ]).notNull(),
  
  // Período
  referenceMonth: int("referenceMonth"),
  referenceYear: int("referenceYear").notNull(),
  
  // Status
  declared: boolean("declared").default(false).notNull(),
  declarationDate: timestamp("declarationDate"),
  
  // Protocolo
  protocolNumber: varchar("protocolNumber", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Declaration = typeof declarations.$inferSelect;
export type InsertDeclaration = typeof declarations.$inferInsert;

/**
 * Sublimites RBT12 (Simples Nacional)
 */
export const rbt12Sublimits = mysqlTable("rbt12Sublimits", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  
  // Dados do sublimite
  referenceYear: int("referenceYear").notNull(),
  rbt12Value: decimal("rbt12Value", { precision: 15, scale: 2 }), // Receita Bruta Total 12 meses
  sublimitValue: decimal("sublimitValue", { precision: 15, scale: 2 }), // Sublimite
  
  // Status
  status: mysqlEnum("status", ["dentro", "proximo", "excedido"]).default("dentro").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rbt12Sublimit = typeof rbt12Sublimits.$inferSelect;
export type InsertRbt12Sublimit = typeof rbt12Sublimits.$inferInsert;

/**
 * Mensagens e-CAC
 */
export const ecacMessages = mysqlTable("ecacMessages", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  
  // Dados da mensagem
  messageTitle: text("messageTitle").notNull(),
  messageContent: text("messageContent"),
  messageDate: timestamp("messageDate").notNull(),
  
  // Status
  read: boolean("read").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EcacMessage = typeof ecacMessages.$inferSelect;
export type InsertEcacMessage = typeof ecacMessages.$inferInsert;

/**
 * Notificações
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"), // Opcional
  
  // Dados da notificação
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  processType: varchar("processType", { length: 50 }), // Tipo de processo relacionado
  
  // Status
  read: boolean("read").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Relatórios Fiscais
 */
export const fiscalReports = mysqlTable("fiscalReports", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  
  // Dados do relatório
  reportType: varchar("reportType", { length: 100 }).notNull(),
  reportTitle: varchar("reportTitle", { length: 255 }).notNull(),
  reportContent: text("reportContent"),
  
  // Período
  referenceMonth: int("referenceMonth"),
  referenceYear: int("referenceYear").notNull(),
  
  // Arquivo (se houver)
  fileUrl: text("fileUrl"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FiscalReport = typeof fiscalReports.$inferSelect;
export type InsertFiscalReport = typeof fiscalReports.$inferInsert;

/**
 * Parametrizações
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Configurações
  numeroDisparo: varchar("numeroDisparo", { length: 50 }),
  emailDisparo: varchar("emailDisparo", { length: 320 }),
  certificadoDigitalId: int("certificadoDigitalId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

/**
 * Agendamentos
 */
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Tipo de agendamento
  scheduleType: mysqlEnum("scheduleType", [
    "das_simples",
    "das_mei",
    "parcelamentos",
    "dctfweb",
    "declaracoes"
  ]).notNull(),
  
  // Dia do mês para execução
  dayOfMonth: int("dayOfMonth").notNull(), // 1-31
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * Consultas API - Histórico de consultas realizadas via InfoSimples
 */
export const apiConsultas = mysqlTable("api_consultas", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(), // Relacionamento com cliente
  userId: int("userId").notNull(), // Usuário que realizou a consulta
  
  // Tipo de consulta
  tipoConsulta: mysqlEnum("tipoConsulta", [
    "cnd_federal",
    "cnd_estadual",
    "regularidade_fgts"
  ]).notNull(),
  
  // Resultado da consulta
  situacao: varchar("situacao", { length: 100 }), // "Regular", "Irregular", "Pendente", etc.
  numeroCertidao: varchar("numeroCertidao", { length: 100 }),
  dataEmissao: timestamp("dataEmissao"),
  dataValidade: timestamp("dataValidade"),
  
  // Dados completos da resposta (JSON)
  respostaCompleta: text("respostaCompleta"), // JSON da resposta da API
  
  // Status da consulta
  sucesso: boolean("sucesso").default(true).notNull(),
  mensagemErro: text("mensagemErro"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiConsulta = typeof apiConsultas.$inferSelect;
export type InsertApiConsulta = typeof apiConsultas.$inferInsert;
