import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => { },
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("API Integration - InfoSimples", () => {
  it("should have apiConsultas router configured", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.apiConsultas).toBeDefined();
    expect(caller.apiConsultas.consultarCNDFederal).toBeDefined();
    expect(caller.apiConsultas.consultarCNDEstadual).toBeDefined();
    expect(caller.apiConsultas.consultarRegularidadeFGTS).toBeDefined();
  });

  it("should have api_consultas table helpers", async () => {
    expect(db.createApiConsulta).toBeDefined();
    expect(db.getApiConsultasByCompany).toBeDefined();
    expect(db.getApiConsultasByUser).toBeDefined();
    expect(db.getLatestApiConsulta).toBeDefined();
  });

  it("should list user consultas", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiConsultas.minhasConsultas();
    expect(Array.isArray(result)).toBe(true);
  });
});
