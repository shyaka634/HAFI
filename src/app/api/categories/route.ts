import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { createId } from "@/lib/utils";
import { CATEGORY_VALUE_PATTERN, categoryValueFromName, listServiceCategories } from "@/features/services/service-categories";
import { enforceRateLimit } from "@/lib/rate-limit";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(50, "Use a category name of 50 characters or fewer.").regex(/[A-Za-z0-9]/, "Enter a category name with letters or numbers."),
});

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "public");
  if (limited) return limited;
  // The home page calls this public endpoint; cache it briefly at the CDN.
  try {
    return NextResponse.json({ categories: await listServiceCategories() }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "Categories could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "admin");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid category name." }, { status: 400 });

  const value = categoryValueFromName(parsed.data.name);
  if (!CATEGORY_VALUE_PATTERN.test(value)) {
    return NextResponse.json({ error: "Use a category name that starts with a letter." }, { status: 400 });
  }

  try {
    const categories = await listServiceCategories();
    if (categories.includes(value)) return NextResponse.json({ error: "That category already exists." }, { status: 409 });

    // `value` is constrained to capital letters, numbers, and underscores
    // before it is embedded in this PostgreSQL enum statement.
    await db.execute(sql.raw(`ALTER TYPE "ServiceCategory" ADD VALUE IF NOT EXISTS '${value}'`));
    await db.insert(auditLogs).values({
      id: createId(),
      actorId: user!.id,
      action: "SERVICE_CATEGORY_CREATED",
      entityType: "ServiceCategory",
      entityId: value,
      details: { name: parsed.data.name },
    });

    return NextResponse.json({ value }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The category could not be created. Please try again." }, { status: 500 });
  }
}
