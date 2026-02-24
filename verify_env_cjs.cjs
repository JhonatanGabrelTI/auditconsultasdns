const dotenv = require("dotenv");
const path = require("path");

console.log("--- DIRETÓRIO ATUAL:", __dirname);
const envPath = path.resolve(__dirname, ".env");
console.log("--- PROCURANDO .env EM:", envPath);

// Simulating the server logic (but in CJS for simplicity of test)
dotenv.config({ path: envPath });

const getApiToken = () => {
    const token = process.env.INFOSIMPLES_API_TOKEN;
    if (!token) {
        dotenv.config();
        return process.env.INFOSIMPLES_API_TOKEN;
    }
    return token;
};

const getIsDev = () => {
    const env = (process.env.NODE_ENV || "").trim();
    return env === "development" || env === "";
};

console.log("NODE_ENV original:", JSON.stringify(process.env.NODE_ENV));
console.log("getIsDev():", getIsDev());
console.log("getApiToken():", getApiToken() ? "OK (found)" : "NOT FOUND");
console.log("Token starts with:", getApiToken() ? getApiToken().substring(0, 5) : "N/A");
