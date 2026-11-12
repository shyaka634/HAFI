"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccessLoading } from "@/components/access-loading";
import { useAppSession } from "@/providers/session-provider";
import "../dashboard-design.css";

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

  return <div className="hafi-dashboard"><div className="hafi-dashboard-inner">
    <header className="hafi-dashboard-heading"><p>District agent dashboard</p><h1>Welcome{user?.name ? `, ${user.name}` : ""}.</h1><p>Assigned district: <strong>{user?.district ?? "Loading…"}</strong></p></header>
    <section className="hafi-dashboard-stats" aria-label="Submission summary"><Stat label="My submissions" value={submissions.length} /><Stat label="Awaiting review" value={pending} /><Stat label="Approved" value={approved} /></section>
    <section className="hafi-dashboard-action"><div><h2>Add or correct a local service</h2><p>Submit a verified location from your district for your province manager to review.</p></div><Link className="hafi-dashboard-button" href="/submit-service">Submit service update</Link></section>
    <section className="hafi-dashboard-section"><h2>Recent submissions</h2><div className="hafi-dashboard-recent">{submissions.slice(0, 5).map((item) => <div key={item.id} className="hafi-dashboard-row"><div><p>{item.name}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div><StatusBadge status={item.status} /></div>)}{!submissions.length && <p className="hafi-dashboard-empty">You have not submitted any service updates yet.</p>}</div></section>
  </div></div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="hafi-dashboard-stat"><h2>{label}</h2><p className="hafi-dashboard-value">{value}</p></div>; }
function StatusBadge({ status }: { status: Submission["status"] }) { return <span className={`hafi-dashboard-status hafi-dashboard-status-${status.toLowerCase()}`}>{status}</span>; }
function AccessMessage({ title }: { title: string }) { return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">{title}</h1><p className="mt-3 text-slate-500">This dashboard is available only to assigned district agents.</p></main>; }
