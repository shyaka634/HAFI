import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { count } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, sessions, users, verifications } from "@/lib/db/schema";

// Better Auth gives every role the same sign-in screen. Custom user fields
// are read-only at sign-up, so only the super administrator can assign roles.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: { enabled: true },
  // The session is renewed only while the application confirms user activity.
  // The shared client guard signs inactive users out after five minutes.
  session: {
    expiresIn: 60 * 5,
    updateAge: 30,
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "USER" },
      province: { type: "string", input: false, required: false },
      district: { type: "string", input: false, required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const [{ total }] = await db.select({ total: count() }).from(users);
          return {
            data: {
              ...user,
              role: total === 0 ? "SUPER_ADMIN" : "USER",
            },
          };
        },
      },
    },
  },
});
