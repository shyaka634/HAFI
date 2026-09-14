"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import type { AppUser } from "@/lib/types";

const destination = {
  AGENT: "/dashboard/agent",
  PROVINCE_MANAGER: "/dashboard/manager",
  SUPER_ADMIN: "/dashboard/admin",
  USER: "/",
} as const;

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      const user = data?.user as AppUser | undefined;
      router.replace(user ? destination[user.role] : "/sign-in");
    });
  }, [router]);

  return <main className="grid min-h-[calc(100vh-150px)] place-items-center text-sm font-semibold text-slate-500">Opening your dashboard…</main>;
}
