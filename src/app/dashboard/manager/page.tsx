"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccessLoading } from "@/components/access-loading";
import { useAppSession } from "@/providers/session-provider";
import "../dashboard-design.css";

type Submission = { id: string; status: "PENDING" | "APPROVED" | "REJECTED" };

export default function ManagerDashboardPage() {
  const { user, isLoading } = useAppSession(); const [submissions, setSubmissions] = useState<Submission[]>([]);
  useEffect(() => { if (user?.role === "PROVINCE_MANAGER") { fetch("/api/submissions").then(async (response) => { if (response.ok) setSubmissions(await response.json()); }).catch(() => {}); } }, [user]);
  if (isLoading) return <AccessLoading />;
  if (user?.role !== "PROVINCE_MANAGER") return <AccessMessage />;
  const pending = submissions.filter((item) => item.status === "PENDING").length;
  return <div className="hafi-dashboard"><div className="hafi-dashboard-inner">
    <header className="hafi-dashboard-heading"><p>Province manager dashboard</p><h1>Review your province&apos;s updates.</h1><p>Assigned province: <strong>{user?.province ?? "Loading…"}</strong></p></header>
    <section className="hafi-dashboard-stats" aria-label="Submission summary"><Stat label="All submissions" value={submissions.length} /><Stat label="Need review" value={pending} /><Stat label="Approved" value={submissions.filter((item) => item.status === "APPROVED").length} /></section>
    <section className="hafi-dashboard-action"><div><h2>Approval queue</h2><p>Review district-agent updates. Approved changes become official services.</p></div><Link className="hafi-dashboard-button" href="/admin/verify">Review {pending} updates</Link></section>
  </div></div>;
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="hafi-dashboard-stat"><h2>{label}</h2><p className="hafi-dashboard-value">{value}</p></div>; }
function AccessMessage() { return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Manager access required</h1><p className="mt-3 text-slate-500">This dashboard is available only to assigned province managers.</p></main>; }
