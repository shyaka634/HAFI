import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE "Discovery" ADD COLUMN IF NOT EXISTS "mediaPublicId" text`;
await sql`ALTER TABLE "Discovery" ADD COLUMN IF NOT EXISTS "mediaResourceType" text`;
console.log("Discovery media metadata columns are ready.");
