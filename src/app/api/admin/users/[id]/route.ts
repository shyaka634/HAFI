import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, sessions, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { provinceForDistrict } from "@/lib/rwanda";
import { createId } from "@/lib/utils";
import { staffAssignmentSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getCurrentUser();
  if (!isSuperAdmin(actor)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const parsed = staffAssignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid assignment." }, { status: 400 });
  const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "SUPER_ADMIN") return NextResponse.json({ error: "The bootstrap super administrator cannot be changed here." }, { status: 403 });
  if (target.archivedAt) return NextResponse.json({ error: "Reactivate this staff account before changing its assignment." }, { status: 409 });
  const data = parsed.data;
  // Zod has already checked these role-specific fields above. The explicit
  // assignments keep TypeScript aware that an agent always has a district.
  const district: string | null = data.role === "AGENT" ? data.district as string : null;
  const province: string | null = data.role === "AGENT"
    ? provinceForDistrict(district as string) ?? null
    : data.role === "PROVINCE_MANAGER"
      ? data.province as string
      : null;
  if (data.role === "AGENT") {
    const agentDistrict = district as string;
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(eq(users.role, "AGENT"), eq(users.district, agentDistrict), isNull(users.archivedAt)));
    if (total >= 30 && target.district !== agentDistrict) return NextResponse.json({ error: "This district already has 30 agents." }, { status: 409 });
  }
  if (data.role === "PROVINCE_MANAGER" && (target.role !== "PROVINCE_MANAGER" || target.province !== province)) {
    const managerProvince = province as string;
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(eq(users.role, "PROVINCE_MANAGER"), eq(users.province, managerProvince), isNull(users.archivedAt)));
    if (total >= 1) return NextResponse.json({ error: "This province already has a manager." }, { status: 409 });
  }
  await db.update(users).set({ role: data.role, district, province, updatedAt: new Date() }).where(eq(users.id, target.id));
  await db.insert(auditLogs).values({ id: createId(), actorId: actor!.id, action: "USER_ROLE_UPDATED", entityType: "User", entityId: target.id, details: { role: data.role, district, province } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getCurrentUser();
  if (!isSuperAdmin(actor)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role !== "AGENT" && target.role !== "PROVINCE_MANAGER") return NextResponse.json({ error: "Only agents and province managers can be deactivated here." }, { status: 403 });
  if (target.archivedAt) return NextResponse.json({ error: "This staff account is already archived." }, { status: 409 });
  const archivedAt = new Date();

  try {
    await db.batch([
      db.delete(sessions).where(eq(sessions.userId, target.id)),
      db.update(users).set({ archivedAt, updatedAt: archivedAt }).where(eq(users.id, target.id)),
      db.insert(auditLogs).values({
      id: createId(),
      actorId: actor!.id,
      action: "USER_DEACTIVATED",
      entityType: "User",
      entityId: target.id,
      details: { email: target.email, role: target.role, district: target.district, province: target.province },
      }),
    ]);
  } catch (error) {
    console.error("Could not deactivate staff account", error);
    return NextResponse.json({ error: "The staff account could not be deactivated. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getCurrentUser();
  if (!isSuperAdmin(actor)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.action !== "REACTIVATE") return NextResponse.json({ error: "Unsupported staff action." }, { status: 400 });

  const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role !== "AGENT" && target.role !== "PROVINCE_MANAGER") return NextResponse.json({ error: "Only archived staff accounts can be reactivated here." }, { status: 403 });
  if (!target.archivedAt) return NextResponse.json({ error: "This staff account is already active." }, { status: 409 });

  if (target.role === "AGENT" && target.district) {
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(eq(users.role, "AGENT"), eq(users.district, target.district), isNull(users.archivedAt)));
    if (total >= 30) return NextResponse.json({ error: "This district already has 30 active agents." }, { status: 409 });
  }
  if (target.role === "PROVINCE_MANAGER" && target.province) {
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(eq(users.role, "PROVINCE_MANAGER"), eq(users.province, target.province), isNull(users.archivedAt)));
    if (total >= 1) return NextResponse.json({ error: "This province already has an active manager." }, { status: 409 });
  }

  const reactivatedAt = new Date();
  await db.batch([
    db.update(users).set({ archivedAt: null, updatedAt: reactivatedAt }).where(eq(users.id, target.id)),
    db.insert(auditLogs).values({ id: createId(), actorId: actor!.id, action: "USER_REACTIVATED", entityType: "User", entityId: target.id, details: { email: target.email, role: target.role, district: target.district, province: target.province } }),
  ]);

  return NextResponse.json({ ok: true });
}
