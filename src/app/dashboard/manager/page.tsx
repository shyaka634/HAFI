"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import type { AppUser } from "@/lib/types";

type Submission = { id: string; status: "PENDING" | "APPROVED" | "REJECTED" };

export default function ManagerDashboardPage() {
  const [user, setUser] = useState<AppUser | null>(null); const [submissions, setSubmissions] = useState<Submission[]>([]);
  useEffect(() => { authClient.getSession().then(async ({ data }) => { const current = (data?.user as AppUser | undefined) ?? null; setUser(current); if (current?.role === "PROVINCE_MANAGER") { const response = await fetch("/api/submissions"); if (response.ok) setSubmissions(await response.json()); } }); }, []);
  if (user && user.role !== "PROVINCE_MANAGER") return <AccessMessage />;
  const pending = submissions.filter((item) => item.status === "PENDING").length;
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><p className="text-sm font-bold uppercase tracking-widest text-forest-700">Province manager dashboard</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Review your province&apos;s updates.</h1><p className="mt-2 text-slate-500">Assigned province: <strong className="text-ink">{user?.province ?? "Loading…"}</strong></p><div className="mt-8 grid gap-5 md:grid-cols-3"><Stat icon={<ClipboardCheck className="h-5 w-5" />} label="All submissions" value={submissions.length} /><Stat icon={<Clock3 className="h-5 w-5" />} label="Need review" value={pending} /><Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Approved" value={submissions.filter((item) => item.status === "APPROVED").length} /></div><Card className="mt-8 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center"><div><h2 className="text-xl font-extrabold text-ink">Approval queue</h2><p className="mt-2 text-sm leading-6 text-slate-500">Review district-agent updates. Approved changes become official services.</p></div><Link href="/admin/verify"><Button><ClipboardCheck className="h-4 w-4" />Review {pending} updates</Button></Link></Card></main>;
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <Card className="p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">{icon}</span><p className="mt-5 text-3xl font-extrabold text-ink">{value}</p><p className="mt-1 text-sm font-semibold text-slate-500">{label}</p></Card>; }
function AccessMessage() { return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Manager access required</h1><p className="mt-3 text-slate-500">This dashboard is available only to assigned province managers.</p></main>; }
