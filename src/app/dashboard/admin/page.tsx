"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, ClipboardList, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import { AccessLoading } from "@/components/access-loading";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import type { AppUser } from "@/lib/types";

type Report = { agents: number; managers: number; submissions: number; archivedStaff: number };

const emptyReport: Report = { agents: 0, managers: 0, submissions: 0, archivedStaff: 0 };

export default function AdminDashboardPage() {
  const [allowed, setAllowed] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [report, setReport] = useState<Report>(emptyReport);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    authClient.getSession().then(async ({ data }) => {
      const user = (data?.user as AppUser | undefined) ?? null;
      const canView = user?.role === "SUPER_ADMIN";
      setAllowed(canView);
      if (!canView) return;

      const response = await fetch("/api/admin/dashboard");
      const result = await response.json().catch(() => null);
      if (response.ok && result) setReport(result);
      else setReportError("The latest report could not be loaded.");
    }).catch(() => setAllowed(false)).finally(() => setCheckingAccess(false));
  }, []);

  if (checkingAccess) return <AccessLoading />;
  if (!allowed) return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Administrator access required</h1></main>;

  const cards = [
    { label: "Registered agents", value: report.agents, description: "Active district agents", icon: UsersRound, tone: "bg-forest-50 text-forest-700" },
    { label: "Registered managers", value: report.managers, description: "Active province managers", icon: UserRoundCog, tone: "bg-lake-50 text-lake-600" },
    { label: "Service submissions", value: report.submissions, description: "All submitted service updates", icon: ClipboardList, tone: "bg-amber-50 text-amber-700" },
  ];

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><p className="text-sm font-bold uppercase tracking-widest text-forest-700">Super administrator report</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Directory at a glance</h1><p className="mt-2 max-w-2xl text-slate-500">A live overview of your active field team and service updates.</p>{reportError ? <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{reportError}</p> : null}<section className="mt-8 grid gap-5 md:grid-cols-3">{cards.map(({ label, value, description, icon: Icon, tone }) => <Card className="p-6" key={label}><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><p className="mt-6 text-4xl font-extrabold tracking-tight text-ink">{value}</p><h2 className="mt-2 font-extrabold text-ink">{label}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></Card>)}</section><section className="mt-8 grid gap-4 sm:grid-cols-2"><Link href="/admin/team"><Card className="flex items-center gap-4 p-5 transition hover:border-forest-200 hover:shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><ShieldCheck className="h-5 w-5" /></span><span><span className="block font-extrabold text-ink">Manage active staff</span><span className="mt-1 block text-sm text-slate-500">Assign roles and territories.</span></span></Card></Link><Link href="/admin/team/archived"><Card className="flex items-center gap-4 p-5 transition hover:border-forest-200 hover:shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Archive className="h-5 w-5" /></span><span><span className="block font-extrabold text-ink">Archived staff ({report.archivedStaff})</span><span className="mt-1 block text-sm text-slate-500">Review and reactivate former staff.</span></span></Card></Link></section></main>;
}
