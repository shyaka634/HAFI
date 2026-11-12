import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLogs, serviceCategoryDescriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { createId } from "@/lib/utils";
import { CATEGORY_VALUE_PATTERN, listServiceCategories } from "@/features/services/service-categories";
import { enforceRateLimit } from "@/lib/rate-limit";

const descriptionSchema = z.object({
  description: z.string().trim().min(2, "Enter a category description.").max(240, "Use a description of 240 characters or fewer."),
});

export async function PATCH(request: Request, { params }: { params: { value: string } }) {
  const limited = await enforceRateLimit(request, "admin");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const value = decodeURIComponent(params.value).toUpperCase();
  if (!CATEGORY_VALUE_PATTERN.test(value) || !(await listServiceCategories()).includes(value)) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  const parsed = descriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid description." }, { status: 400 });

  try {
    await db.insert(serviceCategoryDescriptions).values({
      category: value,
      description: parsed.data.description,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: serviceCategoryDescriptions.category,
      set: { description: parsed.data.description, updatedAt: new Date() },
    });
    await db.insert(auditLogs).values({
      id: createId(),
      actorId: user!.id,
      action: "SERVICE_CATEGORY_DESCRIPTION_UPDATED",
      entityType: "ServiceCategory",
      entityId: value,
      details: { description: parsed.data.description },
    });
    return NextResponse.json({ value, description: parsed.data.description });
  } catch {
    return NextResponse.json({ error: "The category description could not be saved. Please try again." }, { status: 500 });
  }
}
