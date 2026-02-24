
import "dotenv/config";
import postgres from "postgres";
import fs from "fs";
import path from "path";

async function applyMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in .env");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const sql = postgres(connectionString);

    try {
        const migrationPath = path.join(process.cwd(), "drizzle", "0000_material_mandarin.sql");
        const migrationSql = fs.readFileSync(migrationPath, "utf8");

        console.log("Applying initial migration...");
        const statements = migrationSql.split("--> statement-breakpoint");

        for (const statement of statements) {
            if (statement.trim()) {
                await sql.unsafe(statement);
            }
        }

        console.log("Migration applied successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await sql.end();
    }
}

applyMigration();
