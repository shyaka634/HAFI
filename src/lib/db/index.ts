import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

// Next.js imports route modules during `next build`. A harmless placeholder lets
// that compile-time step finish without a secret. It is never contacted unless
// a database route is called without DATABASE_URL configured.
const connectionString = process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/rwanda_services";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
