"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/providers/session-provider";

const destination = {
  AGENT: "/dashboard/agent",
  PROVINCE_MANAGER: "/dashboard/manager",
  SUPER_ADMIN: "/dashboard/admin",
  USER: "/",
} as const;

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAppSession();

  useEffect(() => {
    if (!isLoading) router.replace(user ? destination[user.role] : "/sign-in");
  }, [isLoading, router, user]);

  return <main className="grid min-h-[calc(100vh-150px)] place-items-center text-sm font-semibold text-slate-500">Opening your dashboard…</main>;
}
