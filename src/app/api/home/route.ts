import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { listServiceCategories } from "@/features/services/service-categories";
import { db } from "@/lib/db";
import { discoveries } from "@/lib/db/schema";
import { publicDiscovery } from "@/lib/public-discovery";
import { enforceRateLimit } from "@/lib/rate-limit";

const discoveryFields = {
  id: discoveries.id,
  title: discoveries.title,
  description: discoveries.description,
  imageBase64: discoveries.imageBase64,
  link: discoveries.link,
  placement: discoveries.placement,
  updatedAt: discoveries.updatedAt,
};

async function publishedDiscoveries(placement: "TOP" | "TOP_SECONDARY" | "SIDE", limit: number) {
  const rows = await db
    .select(discoveryFields)
    .from(discoveries)
    .where(and(eq(discoveries.published, true), eq(discoveries.placement, placement)))
    .orderBy(desc(discoveries.createdAt))
    .limit(limit);

  return rows.map(publicDiscovery);
}

// The public landing page needs these pieces together. Returning one compact,
// cacheable response avoids four client requests and four Redis rate-limit
// checks on every first visit.
export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, "public");
  if (limited) return limited;

  try {
    const [categories, top, topSecondary, side] = await Promise.all([
      listServiceCategories(),
      publishedDiscoveries("TOP", 1),
      publishedDiscoveries("TOP_SECONDARY", 6),
      publishedDiscoveries("SIDE", 3),
    ]);
    const refreshRequested = request.nextUrl.searchParams.has("refresh");

    return NextResponse.json(
      { categories, discoveries: { top, topSecondary, side } },
      { headers: { "Cache-Control": refreshRequested ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "Home content could not be loaded." }, { status: 503 });
  }
}
