import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { distanceInKm } from "@/lib/rwanda";
import { serviceSearchSchema } from "@/lib/validation";

const NEARBY_RADIUS_KM = 10;

export async function GET(request: NextRequest) {
  const parsed = serviceSearchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search filters." }, { status: 400 });
  const filters: SQL[] = [];
  if (parsed.data.category) filters.push(eq(services.category, parsed.data.category));
  if (parsed.data.district) filters.push(eq(services.district, parsed.data.district));
  if (parsed.data.name) filters.push(ilike(services.name, `%${parsed.data.name}%`));

  const query = db.select().from(services).orderBy(asc(services.name));
  // Nearby search needs a wider candidate set before distance filtering.
  const limit = parsed.data.nearby ? 500 : 60;
  const rows = filters.length ? await query.where(and(...filters)).limit(limit) : await query.limit(limit);
  const point = parsed.data.lat !== undefined && parsed.data.lng !== undefined ? { lat: parsed.data.lat, lng: parsed.data.lng } : null;
  const result = rows.map((service) => ({ ...service, distanceKm: point ? distanceInKm(point, { lat: service.latitude, lng: service.longitude }) : undefined }));
  if (point) result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  const nearbyResults = parsed.data.nearby && point
    ? result.filter((service) => (service.distanceKm ?? Infinity) <= NEARBY_RADIUS_KM).slice(0, 20)
    : result;
  return NextResponse.json(nearbyResults);
}
