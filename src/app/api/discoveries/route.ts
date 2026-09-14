import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLogs, discoveries } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { createId } from "@/lib/utils";
import { discoveryMediaSourceSchema } from "@/lib/validation";

// TOP remains the first slot so existing top adverts keep their position.
const placementSchema = z.enum(["TOP", "TOP_SECONDARY", "SIDE"]);
const discoverySchema = z.object({
  title: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
  imageUrl: discoveryMediaSourceSchema,
  link: z.string().url().optional(),
  placement: placementSchema.default("SIDE"),
  published: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get("all") === "true";
  if (showAll) {
    const user = await getCurrentUser();
    if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  }
  const placementValue = request.nextUrl.searchParams.get("placement");
  const placement = placementValue === null ? null : placementSchema.safeParse(placementValue);
  if (placement && !placement.success) return NextResponse.json({ error: "Choose a top banner, second top banner, or side banner placement." }, { status: 400 });
  const query = db.select().from(discoveries).orderBy(desc(discoveries.createdAt));
  const filters = [
    ...(showAll ? [] : [eq(discoveries.published, true)]),
    ...(placement && placement.success ? [eq(discoveries.placement, placement.data)] : []),
  ];
  const rows = filters.length ? await query.where(and(...filters)).limit(24) : await query.limit(24);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  const parsed = discoverySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid discovery." }, { status: 400 });
  const id = createId(); const data = parsed.data;
  await db.insert(discoveries).values({ id, title: data.title, description: data.description, imageBase64: data.imageUrl, link: data.link || null, placement: data.placement, published: data.published ?? true, createdAt: new Date(), updatedAt: new Date() });
  await db.insert(auditLogs).values({ id: createId(), actorId: user!.id, action: "DISCOVERY_CREATED", entityType: "Discovery", entityId: id, details: { placement: data.placement } });
  return NextResponse.json({ id }, { status: 201 });
}
