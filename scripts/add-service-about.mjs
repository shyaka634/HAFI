import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);

// Existing databases predate this optional public description. These guards
// make the update safe to run during each deployment.
await sql`ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "about" text`;
await sql`ALTER TABLE "ServiceSubmission" ADD COLUMN IF NOT EXISTS "about" text`;

console.log("Service About columns are ready.");
