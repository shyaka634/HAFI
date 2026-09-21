import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to create performance indexes.");

const sql = neon(connectionString);
const indexes = [
  'CREATE INDEX IF NOT EXISTS "Service_category_idx" ON "Service" ("category")',
  'CREATE INDEX IF NOT EXISTS "Service_district_idx" ON "Service" ("district")',
  'CREATE INDEX IF NOT EXISTS "Service_category_district_idx" ON "Service" ("category", "district")',
  'CREATE INDEX IF NOT EXISTS "Service_latitude_longitude_idx" ON "Service" ("latitude", "longitude")',
  'CREATE INDEX IF NOT EXISTS "User_role_district_archived_idx" ON "User" ("role", "district", "archivedAt")',
  'CREATE INDEX IF NOT EXISTS "User_role_province_archived_idx" ON "User" ("role", "province", "archivedAt")',
  'CREATE INDEX IF NOT EXISTS "Discovery_published_placement_createdAt_idx" ON "Discovery" ("published", "placement", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "ServiceSubmission_status_district_createdAt_idx" ON "ServiceSubmission" ("status", "district", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "ServiceSubmission_submittedBy_createdAt_idx" ON "ServiceSubmission" ("submittedBy", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "ServiceSubmission_targetServiceId_idx" ON "ServiceSubmission" ("targetServiceId")',
  'CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx" ON "AuditLog" ("actorId", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog" ("entityType", "entityId")',
];

for (const statement of indexes) {
  await sql.query(statement);
  console.log(`Applied: ${statement.match(/"[^"]+_idx"/)?.[0] ?? "index"}`);
}

console.log("Performance indexes are ready.");
