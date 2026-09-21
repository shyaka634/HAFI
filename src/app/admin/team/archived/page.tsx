"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArchiveRestore, ArrowLeft, UsersRound } from "lucide-react";
import { AccessLoading } from "@/components/access-loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSession } from "@/providers/session-provider";

type ArchivedMember = {
  id: string;
  name: string | null;
  email: string;
  role: "AGENT" | "PROVINCE_MANAGER";
  district: string | null;
  province: string | null;
  archivedAt: string;
};

export default function ArchivedStaffPage() {
  const { user, isLoading: checkingAccess } = useAppSession();
  const [members, setMembers] = useState<ArchivedMember[]>([]);
  const [notice, setNotice] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/users?archived=true");
    if (response.ok) setMembers(await response.json());
  }

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") void load();
  }, [user]);

  async function reactivate(member: ArchivedMember) {
    const label = member.name || member.email;
    if (!window.confirm(`Reactivate ${label}? They will be able to sign in again.`)) return;

    setRestoringId(member.id);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/users/${member.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "REACTIVATE" }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice(result.error ?? "The staff account could not be reactivated.");
        return;
      }
      setMembers((currentMembers) => currentMembers.filter((currentMember) => currentMember.id !== member.id));
      setNotice("Staff account reactivated. The staff member can sign in again.");
    } catch {
      setNotice("The staff account could not be reactivated. Check your connection and try again.");
    } finally {
      setRestoringId(null);
    }
  }

  if (checkingAccess) return <AccessLoading />;
  if (user?.role !== "SUPER_ADMIN") return <Access />;

  return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><UsersRound className="h-6 w-6" /></span><h1 className="mt-5 text-3xl font-extrabold text-ink">Archived staff</h1><p className="mt-2 max-w-2xl text-slate-500">Deactivated agents and province managers are kept here with their previous assignment and history.</p></div><Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-ink transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700" href="/admin/team"><ArrowLeft className="h-4 w-4" />Active team</Link></div>{notice ? <p className="mt-6 rounded-xl bg-forest-50 px-4 py-3 text-sm font-bold text-forest-700">{notice}</p> : null}<div className="mt-8 space-y-4">{members.length ? members.map((member) => <Card className="p-5" key={member.id}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold text-ink">{member.name || member.email}</p><p className="mt-1 text-sm text-slate-500">{member.email}</p><p className="mt-3 text-sm font-medium text-slate-600">{member.role === "AGENT" ? `District agent · ${member.district ?? "No district"}` : `Province manager · ${member.province ?? "No province"}`}</p><p className="mt-1 text-xs text-slate-400">Deactivated {new Date(member.archivedAt).toLocaleString()}</p></div><Button disabled={restoringId === member.id} onClick={() => reactivate(member)} size="sm"><ArchiveRestore className="h-4 w-4" />{restoringId === member.id ? "Reactivating..." : "Reactivate"}</Button></div></Card>) : <Card className="p-10 text-center"><p className="font-bold text-ink">No staff accounts are archived.</p><p className="mt-2 text-sm text-slate-500">Deactivated agents and managers will appear here.</p></Card>}</div></main>;
}

function Access() {
  return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">Only a super administrator can view archived staff.</p></div>;
}
