"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AccessLoading } from "@/components/access-loading";
import { useAppSession } from "@/providers/session-provider";
import "../dashboard-design.css";

type Report = { agents: number; managers: number; submissions: number; archivedStaff: number };

const emptyReport: Report = { agents: 0, managers: 0, submissions: 0, archivedStaff: 0 };

export default function AdminDashboardPage() {
  const { user, isLoading: checkingAccess } = useAppSession();
  const [report, setReport] = useState<Report>(emptyReport);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") void (async () => {
      const response = await fetch("/api/admin/dashboard");
      const result = await response.json().catch(() => null);
      if (response.ok && result) setReport(result);
      else setReportError("The latest report could not be loaded.");
    })();
  }, [user]);

  if (checkingAccess) return <AccessLoading />;
  if (user?.role !== "SUPER_ADMIN") return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Administrator access required</h1></main>;

  const cards = [
    { label: "Registered agents", value: report.agents, description: "Active district agents", href: "/admin/team?section=agents#staff-directory", action: "View agents" },
    { label: "Registered managers", value: report.managers, description: "Active province managers", href: "/admin/team?section=managers#staff-directory", action: "View managers" },
    { label: "Service submissions", value: report.submissions, description: "All submitted service updates", href: "/admin/verify", action: "View submissions" },
  ];

  return <div className="hafi-dashboard"><div className="hafi-dashboard-inner">
    <header className="hafi-dashboard-heading"><h1>Super administrator report</h1></header>
    {reportError ? <p className="hafi-dashboard-error" role="alert">{reportError}</p> : null}
    <section className="hafi-dashboard-stats" aria-label="Report summary">
      {cards.map(({ label, value, description, href, action }) => <Link className="hafi-dashboard-stat hafi-dashboard-stat-link" href={href} key={label}>
        <h2>{label}</h2><p className="hafi-dashboard-value">{value}</p><p className="hafi-dashboard-muted">{description}</p><span className="hafi-dashboard-link">{action}<ArrowRight aria-hidden="true" size={15} /></span>
      </Link>)}
    </section>
    <section className="hafi-dashboard-section"><h2>Management</h2><div className="hafi-dashboard-shortcuts">
      <Link className="hafi-dashboard-shortcut" href="/admin/team"><span><strong>Manage active staff</strong><small>Assign roles and territories.</small></span><ArrowRight aria-hidden="true" size={16} /></Link>
      <Link className="hafi-dashboard-shortcut" href="/admin/team/archived"><span><strong>Archived staff ({report.archivedStaff})</strong><small>Review and reactivate former staff.</small></span><ArrowRight aria-hidden="true" size={16} /></Link>
      <Link className="hafi-dashboard-shortcut" href="/admin/categories"><span><strong>Manage service categories</strong><small>Add categories for new kinds of services.</small></span><ArrowRight aria-hidden="true" size={16} /></Link>
    </div></section>
  </div></div>;
}
