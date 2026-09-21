"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AccessLoading } from "@/components/access-loading";
import type { SubmissionStatus, SubmissionType } from "@/lib/types";
import { useAppSession } from "@/providers/session-provider";

type Submission = { id: string; name: string; category: string; district: string; address: string | null; latitude: number; longitude: number; notes: string | null; type: SubmissionType; status: SubmissionStatus; createdAt: string };

export default function VerifyPage() {
  const { user, isLoading: checkingAccess } = useAppSession(); const [items, setItems] = useState<Submission[]>([]); const [notice, setNotice] = useState("");
  async function load() { const response = await fetch("/api/submissions"); if (response.ok) setItems(await response.json()); }
  useEffect(() => { if (["PROVINCE_MANAGER", "SUPER_ADMIN"].includes(user?.role ?? "")) void load(); }, [user]);
  async function review(id: string, status: "APPROVED" | "REJECTED") { const response = await fetch(`/api/submissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); const data = await response.json(); if (!response.ok) return setNotice(data.error); setNotice(status === "APPROVED" ? "Submission approved and published." : "Submission rejected."); load(); }
  if (checkingAccess) return <AccessLoading />;
  if (!user || !["PROVINCE_MANAGER", "SUPER_ADMIN"].includes(user.role)) return <Access />;
  return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-5"><div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700"><ClipboardCheck className="h-6 w-6" /></span><h1 className="mt-5 text-3xl font-extrabold text-ink">Review service updates</h1><p className="mt-2 text-slate-500">Only submissions from your province appear in this queue.</p></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">{items.filter((item) => item.status === "PENDING").length} pending</span></div>{notice && <p className="mt-6 rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm font-bold text-forest-700">{notice}</p>}<div className="mt-8 space-y-4">{items.length ? items.map((item) => <Card key={item.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{item.category}</span><span className="rounded-full bg-lake-50 px-2.5 py-1 text-xs font-bold text-lake-600">{item.type === "CREATE" ? "New service" : "Location change"}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status === "PENDING" ? "bg-amber-50 text-amber-700" : item.status === "APPROVED" ? "bg-forest-50 text-forest-700" : "bg-red-50 text-red-700"}`}>{item.status}</span></div><h2 className="mt-3 text-lg font-extrabold text-ink">{item.name}</h2><p className="mt-1 text-sm text-slate-500">{item.address || item.district} · GPS {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</p>{item.notes && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{item.notes}</p>}</div><time className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</time></div>{item.status === "PENDING" && <div className="mt-5 flex gap-3 border-t pt-4"><Button size="sm" onClick={() => review(item.id, "APPROVED")}><Check className="h-4 w-4" />Approve</Button><Button size="sm" variant="secondary" onClick={() => review(item.id, "REJECTED")}><X className="h-4 w-4" />Reject</Button></div>}</Card>) : <Card className="p-10 text-center"><p className="font-bold text-ink">Nothing to review right now.</p><p className="mt-2 text-sm text-slate-500">New submissions will appear here automatically.</p></Card>}</div></div>;
}
function Access() { return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">Province managers and super administrators can review submissions.</p></div>; }
