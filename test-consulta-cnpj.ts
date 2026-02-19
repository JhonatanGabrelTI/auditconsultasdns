import axios from "axios";

const CNPJ = "09.157.307/0001-75";
const TOKEN = "sntc-QB4cRyQ19y-VgLlBZSwh_41YupJFE9g_-Ye";

async function testarConsultas() {
  console.log("=".repeat(70));
  console.log("TESTE DE CONSULTAS - CNPJ:", CNPJ);
  console.log("=".repeat(70));
  
  // Teste 1: CND Federal
  console.log("\n📋 CONSULTANDO CND FEDERAL (PGFN)...");
  console.log("-".repeat(70));
  try {
    const responseCND = await axios.post(
      "https://api.infosimples.com/api/v2/consultas/receita-federal/pgfn",
      {
        token: TOKEN,
        cnpj: CNPJ.replace(/\D/g, ""),
        preferencia_emissao: "nova"
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );
    console.log("✅ RESPOSTA COMPLETA CND FEDERAL:");
    console.log(JSON.stringify(responseCND.data, null, 2));
  } catch (error: any) {
    console.error("❌ Erro CND Federal:", error.response?.data || error.message);
  }

  // Teste 2: Regularidade FGTS
  console.log("\n" + "=".repeat(70));
  console.log("📋 CONSULTANDO REGULARIDADE FGTS (Caixa)...");
  console.log("-".repeat(70));
  try {
    const responseFGTS = await axios.post(
      "https://api.infosimples.com/api/v2/consultas/caixa/regularidade",
      {
        token: TOKEN,
        cnpj: CNPJ.replace(/\D/g, "")
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );
    console.log("✅ RESPOSTA COMPLETA FGTS:");
    console.log(JSON.stringify(responseFGTS.data, null, 2));
  } catch (error: any) {
    console.error("❌ Erro FGTS:", error.response?.data || error.message);
  }

  console.log("\n" + "=".repeat(70));
  console.log("CONSULTAS FINALIZADAS");
  console.log("=".repeat(70));
}

testarConsultas();
