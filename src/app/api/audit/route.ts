import { NextResponse } from "next/server";
import { desc, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { createId } from "@/lib/utils";

const cleanupSchema = z.object({
  amount: z.coerce.number().int().min(1).max(10_000),
  unit: z.enum(["hours", "days", "months"]),
});

function getCutoffDate(amount: number, unit: "hours" | "days" | "months") {
  const cutoff = new Date();

  if (unit === "hours") cutoff.setHours(cutoff.getHours() - amount);
  if (unit === "days") cutoff.setDate(cutoff.getDate() - amount);
  if (unit === "months") cutoff.setMonth(cutoff.getMonth() - amount);

  return cutoff;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const rows = await db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, details: auditLogs.details, createdAt: auditLogs.createdAt, actorName: users.name, actorEmail: users.email }).from(auditLogs).leftJoin(users, eq(auditLogs.actorId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(200);
  return NextResponse.json(rows);
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = cleanupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid amount and time unit." }, { status: 400 });

  const cutoff = getCutoffDate(parsed.data.amount, parsed.data.unit);
  const deleted = await db.delete(auditLogs).where(lt(auditLogs.createdAt, cutoff)).returning({ id: auditLogs.id });

  // Keep a short record that a cleanup happened, even though older logs were removed.
  await db.insert(auditLogs).values({
    id: createId(),
    actorId: user!.id,
    action: "ACTIVITY_HISTORY_CLEANED",
    entityType: "AuditLog",
    details: {
      deletedCount: deleted.length,
      olderThan: `${parsed.data.amount} ${parsed.data.unit}`,
      cutoff: cutoff.toISOString(),
    },
  });

  return NextResponse.json({ deletedCount: deleted.length, cutoff: cutoff.toISOString() });
}
