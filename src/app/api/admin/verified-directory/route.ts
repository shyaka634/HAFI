import { NextResponse } from "next/server";
import { inArray, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, serviceSubmissions, services } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { verifiedDirectorySources, verifiedRwandaServices } from "@/lib/data/verified-rwanda-services";
import { createId } from "@/lib/utils";

// Demo records used IDs beginning with "cmtd". Agent-created locations use
// generated UUIDs, so this cleanup never touches a field submission.
export async function POST() {
  const user = await getCurrentUser();
  if (!isSuperAdmin(user)) {
    return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });
  }

  const now = new Date();
  const demoRows = await db
    .select({ id: services.id })
    .from(services)
    .where(like(services.id, "cmtd%"));

  // A location-change submission can point to an old demo row. Preserve those
  // rows so an agent's review queue cannot lose its target service.
  const submissionRows = await db
    .select({ targetServiceId: serviceSubmissions.targetServiceId })
    .from(serviceSubmissions);
  const protectedIds = new Set(
    submissionRows
      .map((submission) => submission.targetServiceId)
      .filter((id): id is string => Boolean(id)),
  );
  const removableDemoIds = demoRows
    .map((service) => service.id)
    .filter((id) => !protectedIds.has(id));

  if (removableDemoIds.length > 0) {
    await db.delete(services).where(inArray(services.id, removableDemoIds));
  }

  for (const service of verifiedRwandaServices) {
    await db
      .insert(services)
      .values({
        id: service.id,
        name: service.name,
        category: service.category,
        district: service.district,
        sector: service.sector,
        address: service.address,
        phone: service.phone ?? null,
        latitude: service.latitude,
        longitude: service.longitude,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: services.id,
        set: {
          name: service.name,
          category: service.category,
          district: service.district,
          sector: service.sector,
          address: service.address,
          phone: service.phone ?? null,
          latitude: service.latitude,
          longitude: service.longitude,
          updatedAt: now,
        },
      });
  }

  const protectedDemoCount = demoRows.length - removableDemoIds.length;
  await db.insert(auditLogs).values({
    id: createId(),
    actorId: user!.id,
    action: "VERIFIED_DIRECTORY_SEEDED",
    entityType: "ServiceDirectory",
    details: {
      removedDemoServices: removableDemoIds.length,
      protectedDemoServices: protectedDemoCount,
      verifiedServicesAddedOrUpdated: verifiedRwandaServices.length,
      sources: verifiedDirectorySources,
    },
    createdAt: now,
  });

  return NextResponse.json({
    removedDemoServices: removableDemoIds.length,
    protectedDemoServices: protectedDemoCount,
    verifiedServicesAddedOrUpdated: verifiedRwandaServices.length,
  });
}
