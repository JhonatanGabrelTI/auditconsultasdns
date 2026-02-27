import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

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

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    if (isDev) {
      const mockUser = {
        name: "Dev User",
        email: "dev@example.com",
        openId: "mock-openid",
        loginMethod: "mock",
        role: "admin" as const,
      };

      try {
        // Ensure mock user exists in DB to satisfy foreign keys
        const dbUser = await db.upsertUser(mockUser);
        if (dbUser) {
          user = dbUser;
        }
      } catch (dbError) {
        console.error("[Context] Failed to upsert mock user:", dbError);
        // Fallback to locally defined mock if DB fails
        user = {
          id: 1,
          ...mockUser,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };
      }
    } else {
      user = null;
    }
  }

  // Double check: if user is null and we are in dev mode, force mock user (fallback)
  if (!user && isDev) {
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
