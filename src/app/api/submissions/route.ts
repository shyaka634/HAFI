import { NextRequest, NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, serviceSubmissions, services } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { canSubmitForDistrict, isManager, isSuperAdmin } from "@/lib/permissions";
import { RWANDA_PROVINCES } from "@/lib/rwanda";
import { createId } from "@/lib/utils";
import { submissionSchema } from "@/lib/validation";
import { listServiceCategories } from "@/features/services/service-categories";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (isSuperAdmin(user)) {
    return NextResponse.json(await db.select().from(serviceSubmissions).orderBy(desc(serviceSubmissions.createdAt)));
  } else if (isManager(user) && user.province) {
    return NextResponse.json(await db.select().from(serviceSubmissions).where(inArray(serviceSubmissions.district, [...RWANDA_PROVINCES[user.province as keyof typeof RWANDA_PROVINCES]])).orderBy(desc(serviceSubmissions.createdAt)));
  }
  return NextResponse.json(await db.select().from(serviceSubmissions).where(eq(serviceSubmissions.submittedBy, user.id)).orderBy(desc(serviceSubmissions.createdAt)));
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "submission");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid submission." }, { status: 400 });
  const data = parsed.data;
  const { photoBase64, photoUrl, ...submissionData } = data;
  const categories = await listServiceCategories();
  if (!categories.includes(data.category)) return NextResponse.json({ error: "Choose a valid service category." }, { status: 400 });
  if (!canSubmitForDistrict(user, data.district)) return NextResponse.json({ error: "Agents can only submit work in their assigned district." }, { status: 403 });
  if (data.type === "LOCATION_CHANGE") {
    const [target] = await db.select().from(services).where(eq(services.id, data.targetServiceId!)).limit(1);
    if (!target || target.district !== data.district) return NextResponse.json({ error: "Choose an official service in your district." }, { status: 400 });
  }
  const id = createId();
  await db.insert(serviceSubmissions).values({ id, ...submissionData, category: data.category as never, imageBase64: photoUrl || photoBase64 || null, sector: data.sector || null, address: data.address || null, phone: data.phone || null, notes: data.notes || null, targetServiceId: data.targetServiceId || null, submittedBy: user.id, updatedAt: new Date() });
  await db.insert(auditLogs).values({ id: createId(), actorId: user.id, action: "SUBMISSION_CREATED", entityType: "ServiceSubmission", entityId: id, details: { district: data.district, type: data.type, hasPhoto: Boolean(photoUrl || photoBase64) } });
  return NextResponse.json({ id }, { status: 201 });
}
