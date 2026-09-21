import { NextResponse } from "next/server";
import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { provinceForDistrict } from "@/lib/rwanda";
import { createId } from "@/lib/utils";
import { consumeStaffEmailVerificationCode } from "@/lib/staff-email-verification";
import { staffCreationSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const archived = new URL(request.url).searchParams.get("archived") === "true";
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, province: users.province, district: users.district, archivedAt: users.archivedAt, createdAt: users.createdAt }).from(users).where(archived ? isNotNull(users.archivedAt) : isNull(users.archivedAt)).orderBy(asc(users.email));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "admin");
  if (limited) return limited;
  const actor = await getCurrentUser();
  if (!isSuperAdmin(actor)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = staffCreationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid account details." }, { status: 400 });

  const verificationCode = typeof body?.verificationCode === "string" ? body.verificationCode.trim() : "";
  if (!/^\d{6}$/.test(verificationCode)) return NextResponse.json({ error: "Enter the six-digit verification code sent to this email address." }, { status: 400 });

  const data = parsed.data;
  const district = data.role === "AGENT" ? data.district ?? null : null;
  const province = data.role === "AGENT"
    ? provinceForDistrict(district ?? "") ?? null
    : data.role === "PROVINCE_MANAGER"
      ? data.province ?? null
      : null;

  if (data.role === "AGENT") {
    const agentDistrict = data.district as string;
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(eq(users.role, "AGENT"), eq(users.district, agentDistrict), isNull(users.archivedAt)));
    if (total >= 30) return NextResponse.json({ error: "This district already has 30 agents." }, { status: 409 });
  }

  if (data.role === "PROVINCE_MANAGER") {
    const managerProvince = data.province as string;
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(eq(users.role, "PROVINCE_MANAGER"), eq(users.province, managerProvince), isNull(users.archivedAt)));
    if (total >= 1) return NextResponse.json({ error: "This province already has a manager." }, { status: 409 });
  }

  const verification = await consumeStaffEmailVerificationCode(data.email, verificationCode);
  if (!verification.ok) return NextResponse.json({ error: verification.error }, { status: 400 });

  try {
    // Better Auth hashes the password and creates the normal credential record.
    // Roles and territory are set immediately afterwards by this protected route.
    await auth.api.signUpEmail({ body: { name: data.name, email: data.email, password: data.password } });
  } catch {
    return NextResponse.json({ error: "We could not create that account. The email may already be in use." }, { status: 400 });
  }

  const [member] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (!member) return NextResponse.json({ error: "The account was created, but its staff role could not be assigned." }, { status: 500 });

  await db.update(users).set({ role: data.role, district, province, updatedAt: new Date() }).where(eq(users.id, member.id));
  await db.insert(auditLogs).values({
    id: createId(),
    actorId: actor!.id,
    action: data.role === "SUPER_ADMIN" ? "SUPER_ADMIN_CREATED" : "USER_CREATED",
    entityType: "User",
    entityId: member.id,
    details: { email: data.email, role: data.role, district, province },
  });

  return NextResponse.json({ ok: true, id: member.id }, { status: 201 });
}
