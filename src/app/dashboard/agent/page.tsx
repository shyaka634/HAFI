"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, MapPinPlus, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AccessLoading } from "@/components/access-loading";
import { useAppSession } from "@/providers/session-provider";

type Submission = { id: string; name: string; status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string };

export default function AgentDashboardPage() {
  const { user, isLoading } = useAppSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (user?.role === "AGENT") {
      fetch("/api/submissions").then(async (response) => {
        if (response.ok) setSubmissions(await response.json());
      }).catch(() => {});
    }
  }, [user]);

  if (isLoading) return <AccessLoading />;
  if (user?.role !== "AGENT") return <AccessMessage title="Agent access required" />;
  const pending = submissions.filter((item) => item.status === "PENDING").length;
  const approved = submissions.filter((item) => item.status === "APPROVED").length;

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><p className="text-sm font-bold uppercase tracking-widest text-forest-700">District agent dashboard</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Welcome{user?.name ? `, ${user.name}` : ""}.</h1><p className="mt-2 text-slate-500">Assigned district: <strong className="text-ink">{user?.district ?? "Loading…"}</strong></p><div className="mt-8 grid gap-5 md:grid-cols-3"><Stat icon={<ClipboardList className="h-5 w-5" />} label="My submissions" value={submissions.length} /><Stat icon={<Send className="h-5 w-5" />} label="Awaiting review" value={pending} /><Stat icon={<ShieldCheck className="h-5 w-5" />} label="Approved" value={approved} /></div><Card className="mt-8 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center"><div><h2 className="text-xl font-extrabold text-ink">Add or correct a local service</h2><p className="mt-2 text-sm leading-6 text-slate-500">Submit a verified location from your district for your province manager to review.</p></div><Link href="/submit-service"><Button><MapPinPlus className="h-4 w-4" />Submit service update</Button></Link></Card><section className="mt-8"><h2 className="text-lg font-extrabold text-ink">Recent submissions</h2><div className="mt-4 space-y-3">{submissions.slice(0, 5).map((item) => <Card key={item.id} className="flex items-center justify-between p-4"><div><p className="font-bold text-ink">{item.name}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></div><StatusBadge status={item.status} /></Card>)}{!submissions.length && <Card className="p-8 text-center text-sm text-slate-500">You have not submitted any service updates yet.</Card>}</div></section></main>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <Card className="p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">{icon}</span><p className="mt-5 text-3xl font-extrabold text-ink">{value}</p><p className="mt-1 text-sm font-semibold text-slate-500">{label}</p></Card>; }
function StatusBadge({ status }: { status: Submission["status"] }) { const color = { PENDING: "bg-amber-50 text-amber-700", APPROVED: "bg-forest-50 text-forest-700", REJECTED: "bg-red-50 text-red-700" }; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${color[status]}`}>{status}</span>; }
function AccessMessage({ title }: { title: string }) { return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">{title}</h1><p className="mt-3 text-slate-500">This dashboard is available only to assigned district agents.</p></main>; }
