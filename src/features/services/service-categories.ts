import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { SERVICE_CATEGORIES } from "@/lib/types";

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

function orderedCategories(values: string[]) {
  const known = new Set(values);
  return [
    ...SERVICE_CATEGORIES.filter((value) => known.has(value)),
    ...values.filter((value) => !SERVICE_CATEGORIES.includes(value as typeof SERVICE_CATEGORIES[number])),
  ];
}

export async function listServiceCategories() {
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
  return orderedCategories(values);
}
