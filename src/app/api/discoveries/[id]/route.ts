import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLogs, discoveries } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { createId } from "@/lib/utils";
import { discoveryMediaSourceSchema } from "@/lib/validation";

const updateDiscoverySchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: discoveryMediaSourceSchema.optional(),
  link: z.string().url().nullable().optional(),
  placement: z.enum(["TOP", "TOP_SECONDARY", "SIDE"]).optional(),
  published: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, "Include at least one change.");

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const parsed = updateDiscoverySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid discovery update." }, { status: 400 });
  const data = parsed.data;
  await db.update(discoveries).set({
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.imageUrl !== undefined ? { imageBase64: data.imageUrl } : {}),
    ...(data.link !== undefined ? { link: data.link } : {}),
    ...(data.placement !== undefined ? { placement: data.placement } : {}),
    ...(data.published !== undefined ? { published: data.published } : {}),
    updatedAt: new Date(),
  }).where(eq(discoveries.id, params.id));
  await db.insert(auditLogs).values({ id: createId(), actorId: user!.id, action: "DISCOVERY_UPDATED", entityType: "Discovery", entityId: params.id, details: data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  await db.delete(discoveries).where(eq(discoveries.id, params.id));
  await db.insert(auditLogs).values({ id: createId(), actorId: user!.id, action: "DISCOVERY_DELETED", entityType: "Discovery", entityId: params.id });
  return NextResponse.json({ ok: true });
}
