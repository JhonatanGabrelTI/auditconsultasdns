import "dotenv/config";
import { appRouter } from "./server/routers";
import * as db from "./server/db";

async function test() {
    const companyId = "8e0a3c5b-fa13-4deb-9447-235c99d46409";
    console.log("Testing with company ID:", companyId);

    // 2. Mock context
    const ctx = {
        user: { id: 1, role: 'admin' },
        req: {} as any,
        res: {} as any,
    };

    // 3. Call mutation directly from router
    const caller = appRouter.createCaller(ctx as any);

    try {
        console.log("Calling consultarCNDFederal...");
        const result = await caller.apiConsultas.consultarCNDFederal({ companyId });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("TRPC Error:", e.message);
    }
}

test();
