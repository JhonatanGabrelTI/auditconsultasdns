const { createCompany } = require("./server/db");
const { getUserByOpenId } = require("./server/db");

async function test() {
    try {
        const user = await getUserByOpenId("mock-openid");
        console.log("Current User:", user);

        if (!user) {
            console.log("User not found, exiting.");
            return;
        }

        const result = await createCompany({
            name: "Teste Salvamento " + Date.now(),
            personType: "juridica",
            cnpj: "123456780001" + Math.floor(Math.random() * 99),
            userId: user.id
        });
        console.log("Success:", result);
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
