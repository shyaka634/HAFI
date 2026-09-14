import { NextResponse } from "next/server";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceSubmissions, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const [[agents], [managers], [submissions], [archivedAgents], [archivedManagers]] = await Promise.all([
    db.select({ total: count() }).from(users).where(and(eq(users.role, "AGENT"), isNull(users.archivedAt))),
    db.select({ total: count() }).from(users).where(and(eq(users.role, "PROVINCE_MANAGER"), isNull(users.archivedAt))),
    db.select({ total: count() }).from(serviceSubmissions),
    db.select({ total: count() }).from(users).where(and(isNotNull(users.archivedAt), eq(users.role, "AGENT"))),
    db.select({ total: count() }).from(users).where(and(isNotNull(users.archivedAt), eq(users.role, "PROVINCE_MANAGER"))),
  ]);

  return NextResponse.json({ agents: agents.total, managers: managers.total, submissions: submissions.total, archivedStaff: archivedAgents.total + archivedManagers.total });
}
