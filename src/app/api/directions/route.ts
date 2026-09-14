import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  fromLat: z.coerce.number(), fromLng: z.coerce.number(), toLat: z.coerce.number(), toLng: z.coerce.number(),
});

type OsrmStep = {
  name?: string;
  maneuver?: { type?: string; modifier?: string };
};

function isRouteCoordinate(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === "number"
    && Number.isFinite(value[0])
    && typeof value[1] === "number"
    && Number.isFinite(value[1]);
}

function formatStep(step: OsrmStep) {
  const road = step.name ? ` onto ${step.name}` : "";
  const maneuver = step.maneuver?.type;
  const modifier = step.maneuver?.modifier?.replace("slight ", "slightly ");

  if (maneuver === "depart") return `Start${road}.`;
  if (maneuver === "arrive") return "Arrive at your destination.";
  if (maneuver === "roundabout") return `Use the roundabout${road}.`;
  if (maneuver === "continue" || maneuver === "new name") return `Continue${road}.`;
  if (maneuver === "turn" && modifier) return `Turn ${modifier}${road}.`;
  return `Continue${road}.`;
}

// OSRM is free and does not require an API key for this MVP.
export async function GET(request: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Missing route coordinates." }, { status: 400 });
  const { fromLat, fromLng, toLat, toLng } = parsed.data;
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`, { next: { revalidate: 60 } });
  if (!response.ok) return NextResponse.json({ error: "Directions are temporarily unavailable." }, { status: 502 });
  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) return NextResponse.json({ error: "No driving route was found." }, { status: 404 });
  const rawCoordinates = route.geometry?.coordinates;
  const coordinates = Array.isArray(rawCoordinates)
    ? rawCoordinates.filter(isRouteCoordinate).map(([longitude, latitude]) => [latitude, longitude] as [number, number])
    : [];
  if (coordinates.length < 2) return NextResponse.json({ error: "The route could not be drawn on the map." }, { status: 502 });
  const steps = (route.legs ?? [])
    .flatMap((leg: { steps?: OsrmStep[] }) => leg.steps ?? [])
    .map(formatStep)
    .slice(0, 30);
  return NextResponse.json({ distanceKm: route.distance / 1000, durationMinutes: Math.ceil(route.duration / 60), steps, coordinates });
}
