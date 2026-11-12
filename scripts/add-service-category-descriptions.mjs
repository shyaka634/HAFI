import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
await sql`
  CREATE TABLE IF NOT EXISTS "ServiceCategoryDescription" (
    "category" text PRIMARY KEY,
    "description" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )
`;
console.log("Service category descriptions table is ready.");
