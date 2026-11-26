import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLogs, serviceCategoryDescriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { createId } from "@/lib/utils";
import { CATEGORY_VALUE_PATTERN, categoryValueFromName, listServiceCategoryDetails } from "@/features/services/service-categories";
import { enforceRateLimit } from "@/lib/rate-limit";

const categoryUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(50, "Use a category name of 50 characters or fewer.").regex(/[A-Za-z0-9]/, "Enter a category name with letters or numbers.").optional(),
  description: z.string().trim().max(240, "Use a description of 240 characters or fewer.").optional(),
}).refine((data) => data.name !== undefined || data.description !== undefined, {
  message: "Provide a category name or description to update.",
});

export async function PATCH(request: Request, { params }: { params: { value: string } }) {
  const limited = await enforceRateLimit(request, "admin");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const value = decodeURIComponent(params.value).toUpperCase();
  const categories = await listServiceCategoryDetails();
  const currentCategory = categories.find((category) => category.value === value);
  if (!CATEGORY_VALUE_PATTERN.test(value) || !currentCategory) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  const parsed = categoryUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter valid category details." }, { status: 400 });

  const name = parsed.data.name ?? currentCategory.name;
  const description = parsed.data.description ?? currentCategory.description;
  const hasDuplicateName = categories.some((category) => category.value !== value && categoryValueFromName(category.name) === categoryValueFromName(name));
  if (hasDuplicateName) return NextResponse.json({ error: "That category name is already in use." }, { status: 409 });

  try {
    await db.insert(serviceCategoryDescriptions).values({
      category: value,
      name,
      description,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: serviceCategoryDescriptions.category,
      set: { name, description, updatedAt: new Date() },
    });
    await db.insert(auditLogs).values({
      id: createId(),
      actorId: user!.id,
      action: "SERVICE_CATEGORY_UPDATED",
      entityType: "ServiceCategory",
      entityId: value,
      details: { name, description },
    });
    return NextResponse.json({ value, name, description });
  } catch {
    return NextResponse.json({ error: "The category could not be saved. Please try again." }, { status: 500 });
  }
}
