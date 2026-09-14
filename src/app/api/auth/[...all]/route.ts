import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/sign-in/email")) {
    const body = await request.clone().json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email) {
      const [archivedAccount] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), isNotNull(users.archivedAt))).limit(1);
      if (archivedAccount) return NextResponse.json({ message: "This staff account has been deactivated. Contact a super administrator to reactivate it." }, { status: 403 });
    }
  }

  return handlers.POST(request);
}
