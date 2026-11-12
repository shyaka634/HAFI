import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceCategoryDescriptions } from "@/lib/db/schema";
import { SERVICE_CATEGORIES } from "@/lib/types";
import { categoryDescription } from "@/features/services/service-category-copy";

export const CATEGORY_VALUE_PATTERN = /^[A-Z][A-Z0-9_]{1,49}$/;

export function categoryValueFromName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

export type ServiceCategoryDetails = { value: string; description: string };

function orderedCategories(values: string[]) {
  const known = new Set(values);
  return [
    ...SERVICE_CATEGORIES.filter((value) => known.has(value)),
    ...values.filter((value) => !SERVICE_CATEGORIES.includes(value as typeof SERVICE_CATEGORIES[number])),
  ];
}

export async function listServiceCategories() {
  return (await listServiceCategoryDetails()).map((category) => category.value);
}

export async function listServiceCategoryDetails(): Promise<ServiceCategoryDetails[]> {
  const result = await db.execute(sql`
    SELECT enum_value.enumlabel AS value
    FROM pg_enum AS enum_value
    INNER JOIN pg_type AS enum_type ON enum_type.oid = enum_value.enumtypid
    WHERE enum_type.typname = 'ServiceCategory'
    ORDER BY enum_value.enumsortorder
  `);
  const values = result.rows
    .map((row) => String((row as { value?: unknown }).value ?? ""))
    .filter((value) => CATEGORY_VALUE_PATTERN.test(value));
  const descriptions = await db
    .select({ category: serviceCategoryDescriptions.category, description: serviceCategoryDescriptions.description })
    .from(serviceCategoryDescriptions);
  const descriptionsByCategory = new Map(descriptions.map((item) => [item.category, item.description]));

  return orderedCategories(values).map((value) => ({
    value,
    description: descriptionsByCategory.get(value) || categoryDescription(value, "en"),
  }));
}
