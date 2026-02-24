
import postgres from "postgres";

async function findRegion() {
    const regions = [
        "us-east-1", "us-east-2", "us-west-1", "us-west-2",
        "ca-central-1", "sa-east-1", "eu-west-1", "eu-west-2",
        "eu-west-3", "eu-central-1", "eu-central-2", "eu-north-1",
        "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
        "ap-northeast-2", "ap-south-1"
    ];
    const refs = ["dsmbfwzekaebuadjfcot", "apbkobhfnmcqqzqeeqss"];
    const password = "HtgxB4kP1xfBx7cm";

    for (const ref of refs) {
        console.log(`--- Testing Ref: ${ref} ---`);
        for (const region of regions) {
            const host = `aws-0-${region}.pooler.supabase.com`;
            const connectionString = `postgresql://postgres.${ref}:${password}@${host}:6543/postgres`;

            const sql = postgres(connectionString, {
                idle_timeout: 1,
                connect_timeout: 2
            });

            try {
                await sql`SELECT 1`;
                console.log(`\n🎉 SUCCESS! Found it!`);
                console.log(`Ref: ${ref}`);
                console.log(`Region: ${region}`);
                console.log(`Connection String: postgresql://postgres.${ref}:[PASSWORD]@${host}:6543/postgres`);
                process.exit(0);
            } catch (error) {
                // Just log a dot for progress
                process.stdout.write(".");
            } finally {
                await sql.end();
            }
        }
        console.log("\n");
    }
}

findRegion();
