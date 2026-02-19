CREATE TABLE "api_consultas" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"companyId" uuid NOT NULL,
	"tipoConsulta" text NOT NULL,
	"cnpjConsultado" varchar(14),
	"cpfConsultado" varchar(11),
	"ufConsultada" varchar(2),
	"municipioConsultado" varchar(50),
	"status" text DEFAULT 'pending' NOT NULL,
	"resultado" text,
	"custo" varchar(10),
	"infoSimplesId" varchar(50),
	"errorMessage" text,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" integer NOT NULL,
	"personType" text NOT NULL,
	"name" text NOT NULL,
	"cnpj" varchar(14),
	"cpf" varchar(11),
	"taxRegime" text,
	"accessCode" text,
	"certificatePath" text,
	"certificatePasswordHash" text,
	"certificateExpiresAt" timestamp,
	"inscricaoEstadual" text,
	"dataNascimento" text,
	"emails" jsonb,
	"whatsapps" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "declarations" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" uuid NOT NULL,
	"declarationType" text NOT NULL,
	"period" varchar(7) NOT NULL,
	"declared" boolean DEFAULT false NOT NULL,
	"declarationDate" timestamp,
	"protocol" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digitalCertificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" uuid NOT NULL,
	"name" text NOT NULL,
	"serialNumber" text,
	"issuer" text,
	"subject" text,
	"validFrom" timestamp,
	"validUntil" timestamp,
	"path" text,
	"passwordHash" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecacMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" uuid NOT NULL,
	"messageType" text NOT NULL,
	"subject" text NOT NULL,
	"content" text,
	"messageDate" timestamp,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"serviceType" text,
	"status" text,
	"resultSummary" jsonb,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fiscalProcesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" uuid NOT NULL,
	"processType" text NOT NULL,
	"status" text DEFAULT 'em_dia' NOT NULL,
	"details" text,
	"lastCheck" timestamp,
	"nextCheck" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscalReports" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" uuid NOT NULL,
	"reportType" text NOT NULL,
	"period" varchar(7) NOT NULL,
	"content" text,
	"generatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"processType" text,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pendencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"source" text,
	"description" text,
	"amount" numeric(10, 2),
	"detectedAt" timestamp DEFAULT now(),
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "procuracoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" uuid NOT NULL,
	"type" text DEFAULT 'ecac' NOT NULL,
	"cpfRepresentante" varchar(14) NOT NULL,
	"nomeRepresentante" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbt12Sublimits" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" uuid NOT NULL,
	"rbt12Value" varchar(20) NOT NULL,
	"sublimit" varchar(20) NOT NULL,
	"percentageUsed" varchar(10),
	"alert" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"processType" text NOT NULL,
	"dayOfMonth" integer NOT NULL,
	"time" varchar(5) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"lastRun" timestamp,
	"nextRun" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"whatsappNotifications" boolean DEFAULT false NOT NULL,
	"alertThresholdDays" integer DEFAULT 7 NOT NULL,
	"defaultView" text DEFAULT 'grid' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" text NOT NULL,
	"name" text,
	"email" text,
	"loginMethod" text,
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "api_consultas" ADD CONSTRAINT "api_consultas_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_consultas" ADD CONSTRAINT "api_consultas_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digitalCertificates" ADD CONSTRAINT "digitalCertificates_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecacMessages" ADD CONSTRAINT "ecacMessages_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscalProcesses" ADD CONSTRAINT "fiscalProcesses_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscalReports" ADD CONSTRAINT "fiscalReports_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencies" ADD CONSTRAINT "pendencies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procuracoes" ADD CONSTRAINT "procuracoes_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbt12Sublimits" ADD CONSTRAINT "rbt12Sublimits_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;