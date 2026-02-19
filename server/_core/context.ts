import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Check for development mode FIRST
  const isDev = process.env.NODE_ENV?.trim() === "development";
  console.log(`[Context] Creating context. isDev=${isDev}, NODE_ENV="${process.env.NODE_ENV}"`);

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    if (isDev) {
      console.log("[Context] Auth failed in dev mode, using mock user.");
      user = {
        id: 1,
        name: "Dev User",
        email: "dev@example.com",
        openId: "mock-openid",
        loginMethod: "mock",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    } else {
      user = null;
    }
  }

  // Double check: if user is null and we are in dev mode, force mock user
  if (!user && isDev) {
    console.log("[Context] User is null in dev mode, forcing mock user.");
    user = {
      id: 1,
      name: "Dev User",
      email: "dev@example.com",
      openId: "mock-openid",
      loginMethod: "mock",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
