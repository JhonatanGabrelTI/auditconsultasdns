import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("clients router", () => {
  it("should list clients for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.companies.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should search clients with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.companies.search({
      searchTerm: "test",
      taxRegime: "simples_nacional",
    });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("fiscalProcesses router", () => {
  it("should get fiscal process stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fiscalProcesses.getStats();

    expect(result).toHaveProperty("emDia");
    expect(result).toHaveProperty("pendente");
    expect(result).toHaveProperty("atencao");
    expect(typeof result.emDia).toBe("number");
    expect(typeof result.pendente).toBe("number");
    expect(typeof result.atencao).toBe("number");
  });
});

describe("notifications router", () => {
  it("should list notifications for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("settings router", () => {
  it("should get settings for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.get();

    // Settings may be undefined if not yet created
    expect(result === undefined || typeof result === "object").toBe(true);
  });
});

describe("schedules router", () => {
  it("should list schedules for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.schedules.list();

    expect(Array.isArray(result)).toBe(true);
  });
});
