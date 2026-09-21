import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { distanceInKm } from "@/lib/rwanda";
import { serviceSearchSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";

const NEARBY_RADIUS_KM = 10;

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, "public");
  if (limited) return limited;
  const parsed = serviceSearchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search filters." }, { status: 400 });
  const filters: SQL[] = [];
  if (parsed.data.category) filters.push(sql`${services.category} = ${parsed.data.category}`);
  if (parsed.data.district) filters.push(eq(services.district, parsed.data.district));
  if (parsed.data.name) filters.push(ilike(services.name, `%${parsed.data.name}%`));

  const point = parsed.data.lat !== undefined && parsed.data.lng !== undefined ? { lat: parsed.data.lat, lng: parsed.data.lng } : null;
  // Narrow nearby candidates in PostgreSQL before calculating exact distances.
  // This avoids loading a large nationwide directory for every location search.
  if (parsed.data.nearby && point) {
    const latitudeDelta = NEARBY_RADIUS_KM / 111;
    const longitudeDelta = NEARBY_RADIUS_KM / (111 * Math.max(Math.cos(point.lat * Math.PI / 180), 0.1));
    filters.push(gte(services.latitude, point.lat - latitudeDelta), lte(services.latitude, point.lat + latitudeDelta), gte(services.longitude, point.lng - longitudeDelta), lte(services.longitude, point.lng + longitudeDelta));
  }

  const query = db.select().from(services).orderBy(asc(services.name));
  const limit = parsed.data.nearby ? 150 : 60;
  const rows = filters.length ? await query.where(and(...filters)).limit(limit) : await query.limit(limit);
  const result = rows.map((service) => ({ ...service, distanceKm: point ? distanceInKm(point, { lat: service.latitude, lng: service.longitude }) : undefined }));
  if (point) result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  const nearbyResults = parsed.data.nearby && point
    ? result.filter((service) => (service.distanceKm ?? Infinity) <= NEARBY_RADIUS_KM).slice(0, 20)
    : result;
  return NextResponse.json(nearbyResults, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
