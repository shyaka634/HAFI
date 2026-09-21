"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SessionIdleGuard } from "@/components/session-idle-guard";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandaloneAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  if (isStandaloneAuthPage) return <main className="flex-1">{children}</main>;

  return <><SessionIdleGuard /><SiteHeader /><main className="flex-1">{children}</main><SiteFooter /></>;
}
