import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { AppUser } from "@/lib/types";

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: headers() });
  const user = (session?.user as AppUser | undefined) ?? null;
  if (!user) return null;

  const [account] = await db.select({ archivedAt: users.archivedAt }).from(users).where(eq(users.id, user.id)).limit(1);
  return account?.archivedAt ? null : user;
}
