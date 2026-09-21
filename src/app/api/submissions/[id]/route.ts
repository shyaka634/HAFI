import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, serviceSubmissions, services } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { canReviewDistrict } from "@/lib/permissions";
import { createId } from "@/lib/utils";
import { reviewSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const limited = await enforceRateLimit(request, "admin");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [submission] = await db.select().from(serviceSubmissions).where(eq(serviceSubmissions.id, params.id)).limit(1);
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  if (!canReviewDistrict(user, submission.district)) return NextResponse.json({ error: "This submission is outside your province." }, { status: 403 });
  if (submission.status !== "PENDING") return NextResponse.json({ error: "This submission was already reviewed." }, { status: 409 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });

  if (parsed.data.status === "APPROVED") {
    const serviceData = { name: submission.name, category: submission.category, district: submission.district, sector: submission.sector, address: submission.address, phone: submission.phone, latitude: submission.latitude, longitude: submission.longitude, updatedAt: new Date() };
    if (submission.type === "LOCATION_CHANGE" && submission.targetServiceId) {
      await db.update(services).set({ ...serviceData, ...(submission.imageBase64 ? { imageBase64: submission.imageBase64 } : {}) }).where(eq(services.id, submission.targetServiceId));
    } else {
      await db.insert(services).values({ id: createId(), ...serviceData, imageBase64: submission.imageBase64, createdAt: new Date() });
    }
  }
  await db.update(serviceSubmissions).set({ status: parsed.data.status, reviewNote: parsed.data.reviewNote || null, reviewedBy: user.id, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(serviceSubmissions.id, submission.id));
  await db.insert(auditLogs).values({ id: createId(), actorId: user.id, action: parsed.data.status === "APPROVED" ? "SUBMISSION_APPROVED" : "SUBMISSION_REJECTED", entityType: "ServiceSubmission", entityId: submission.id, details: { district: submission.district } });
  return NextResponse.json({ ok: true });
}
