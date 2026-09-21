import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import { sendStaffEmailVerificationCode } from "@/lib/staff-email-verification";
import { staffCreationSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "email");
  if (limited) return limited;
  const actor = await getCurrentUser();
  if (!isSuperAdmin(actor)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const parsed = staffCreationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter valid account details before sending a code." }, { status: 400 });

  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existingUser) return NextResponse.json({ error: "An account with this email address already exists." }, { status: 409 });

  try {
    await sendStaffEmailVerificationCode(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The verification code could not be sent.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
