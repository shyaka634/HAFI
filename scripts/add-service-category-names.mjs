import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
await sql`
  CREATE TABLE IF NOT EXISTS "ServiceCategoryDescription" (
    "category" text PRIMARY KEY,
    "name" text,
    "description" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )
`;
await sql`ALTER TABLE "ServiceCategoryDescription" ADD COLUMN IF NOT EXISTS "name" text`;
console.log("Service category display-name storage is ready.");
