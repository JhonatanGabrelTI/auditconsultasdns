import { consultarCNDFederal } from "./server/infosimples";

async function test() {
    console.log("NODE_ENV:", process.env.NODE_ENV);

    try {
        const result = await consultarCNDFederal("01054379000107");
        console.log("Result Code:", result.code);
        console.log("Result Message:", result.code_message);
        console.log("Is Mock?", result.code_message.includes("(MOCK)"));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

test();
