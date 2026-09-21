import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLogs, discoveries } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { createId } from "@/lib/utils";
import { discoveryMediaSourceSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { deleteDiscoveryFromCloudinary } from "@/lib/cloudinary";

const cloudinaryMediaSchema = z.object({
  mediaPublicId: z.string().trim().min(1).max(500).nullable().optional(),
  mediaResourceType: z.enum(["image", "video"]).nullable().optional(),
}).refine(
  (data) => (data.mediaPublicId === undefined && data.mediaResourceType === undefined) || Boolean(data.mediaPublicId) === Boolean(data.mediaResourceType),
  "Cloudinary media details must include both the public ID and media type.",
);
const updateDiscoverySchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: discoveryMediaSourceSchema.optional(),
  link: z.string().url().nullable().optional(),
  placement: z.enum(["TOP", "TOP_SECONDARY", "SIDE"]).optional(),
  published: z.boolean().optional(),
}).and(cloudinaryMediaSchema).refine((data) => Object.keys(data).length > 0, "Include at least one change.");

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const limited = await enforceRateLimit(request, "admin");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const parsed = updateDiscoverySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid discovery update." }, { status: 400 });
  const data = parsed.data;
  await db.update(discoveries).set({
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.imageUrl !== undefined ? { imageBase64: data.imageUrl } : {}),
    ...(data.mediaPublicId !== undefined ? { mediaPublicId: data.mediaPublicId } : {}),
    ...(data.mediaResourceType !== undefined ? { mediaResourceType: data.mediaResourceType } : {}),
    ...(data.link !== undefined ? { link: data.link } : {}),
    ...(data.placement !== undefined ? { placement: data.placement } : {}),
    ...(data.published !== undefined ? { published: data.published } : {}),
    updatedAt: new Date(),
  }).where(eq(discoveries.id, params.id));
  await db.insert(auditLogs).values({ id: createId(), actorId: user!.id, action: "DISCOVERY_UPDATED", entityType: "Discovery", entityId: params.id, details: data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const limited = await enforceRateLimit(request, "admin");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const [discovery] = await db.select({ mediaPublicId: discoveries.mediaPublicId, mediaResourceType: discoveries.mediaResourceType }).from(discoveries).where(eq(discoveries.id, params.id)).limit(1);
  if (!discovery) return NextResponse.json({ error: "Banner not found." }, { status: 404 });

  try {
    if (discovery.mediaPublicId && (discovery.mediaResourceType === "image" || discovery.mediaResourceType === "video")) {
      await deleteDiscoveryFromCloudinary({ publicId: discovery.mediaPublicId, resourceType: discovery.mediaResourceType });
    }
  } catch {
    // Do not delete the database record when its Cloudinary asset could not
    // be removed. That makes the failure visible and prevents orphaned media.
    return NextResponse.json({ error: "The banner could not be removed from Cloudinary. Please try again." }, { status: 502 });
  }
  await db.delete(discoveries).where(eq(discoveries.id, params.id));
  await db.insert(auditLogs).values({ id: createId(), actorId: user!.id, action: "DISCOVERY_DELETED", entityType: "Discovery", entityId: params.id });
  return NextResponse.json({ ok: true });
}
