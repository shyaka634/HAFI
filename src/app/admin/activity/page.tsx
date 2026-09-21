"use client";

import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccessLoading } from "@/components/access-loading";
import { useAppSession } from "@/providers/session-provider";

type Event = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
};

type Detail = { label: string; value: string };
type CleanupUnit = "hours" | "days" | "months";

const detailLabels: Record<string, string> = {
  district: "District",
  province: "Province",
  role: "Role",
  type: "Submission type",
  status: "Status",
  published: "Published",
  title: "Title",
  description: "Description",
  link: "Link",
  removedDemoServices: "Sample records removed",
  protectedDemoServices: "Protected records",
  verifiedServicesAddedOrUpdated: "Verified services synced",
  sources: "Sources",
  deletedCount: "Records deleted",
  olderThan: "Cleanup range",
  cutoff: "Deleted before",
};

function titleCase(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDetailValue(key: string, value: unknown) {
  if (key === "sources" && Array.isArray(value)) return `${value.length} reference sources recorded`;
  if (key === "imageUrl" || key === "imageBase64") return "Advert media updated";
  if (key === "link") return value ? "Link updated" : "No link";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "Not set";
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === "object") return "Updated";

  const text = String(value);
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function formatDetails(details: Event["details"]): Detail[] {
  if (!details) return [];

  return Object.entries(details).map(([key, value]) => ({
    label: detailLabels[key] ?? titleCase(key),
    value: formatDetailValue(key, value),
  }));
}

function formatRange(amount: number, unit: CleanupUnit) {
  return `${amount} ${amount === 1 ? unit.slice(0, -1) : unit}`;
}

function ActivityCard({ event }: { event: Event }) {
  const details = formatDetails(event.details);
  const actor = event.actorName || event.actorEmail || "System";

  return (
    <Card className="min-w-0 overflow-hidden p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-ink">{titleCase(event.action)}</p>
          <p className="mt-1 text-sm text-slate-500">{actor} - {event.entityType}</p>

          {details.length > 0 ? (
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{detail.label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium text-slate-600">{detail.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <time className="shrink-0 text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</time>
      </div>
    </Card>
  );
}
export default function ActivityPage() {
  const { user, isLoading: checkingAccess } = useAppSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [amount, setAmount] = useState("30");
  const [unit, setUnit] = useState<CleanupUnit>("days");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState("");

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      fetch("/api/audit").then(async (response) => {
        if (response.ok) setEvents(await response.json());
      }).catch(() => {});
    }
  }, [user]);

  async function deleteOlderHistory() {
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount < 1 || numericAmount > 10_000) {
      setCleanupMessage("Enter a whole number between 1 and 10,000.");
      return;
    }

    const range = formatRange(numericAmount, unit);
    const confirmed = window.confirm(`Delete all activity history older than ${range}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    setCleanupMessage("");

    try {
      const response = await fetch("/api/audit", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, unit }),
      });
      const result = await response.json();

      if (!response.ok) {
        setCleanupMessage(result.error || "Could not delete the activity history.");
        return;
      }

      setCleanupMessage(`${result.deletedCount} activity record(s) deleted. A cleanup record was kept.`);
      const refreshedEvents = await fetch("/api/audit");
      if (refreshedEvents.ok) setEvents(await refreshedEvents.json());
    } catch {
      setCleanupMessage("Could not delete the activity history. Check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (checkingAccess) return <AccessLoading />;
  if (user?.role !== "SUPER_ADMIN") return <Access />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700">
          <History className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Field activity history</h1>
        <p className="mt-2 text-slate-500">A clear record of submissions, reviews, role changes and discovery updates.</p>
      </div>

      <Card className="mt-8 border border-red-100 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-extrabold text-ink">Delete activity history</p>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Choose how old records must be before they are permanently deleted. The newest cleanup record is kept for accountability.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Delete records older than
              <input
                type="number"
                min="1"
                max="10000"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-ink outline-none transition focus:border-forest-500 focus:ring-4 focus:ring-forest-100 sm:w-28"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Time unit
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value as CleanupUnit)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-ink outline-none transition focus:border-forest-500 focus:ring-4 focus:ring-forest-100"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="months">Months</option>
              </select>
            </label>
            <Button variant="danger" type="button" onClick={deleteOlderHistory} disabled={isDeleting} className="shrink-0">
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete history"}
            </Button>
          </div>
        </div>
        {cleanupMessage ? <p className="mt-4 text-sm font-medium text-slate-600" role="status">{cleanupMessage}</p> : null}
      </Card>

      <div className="mt-8 space-y-3">
        {events.length ? (
          events.map((event) => <ActivityCard key={event.id} event={event} />)
        ) : (
          <Card className="p-10 text-center">
            <p className="font-bold text-ink">No work has been recorded yet.</p>
          </Card>
        )}
      </div>
    </main>
  );

  /*
  return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700"><History className="h-6 w-6" /></span><h1 className="mt-5 text-3xl font-extrabold text-ink">Field activity history</h1><p className="mt-2 text-slate-500">A clear record of submissions, reviews, role changes and discovery updates.</p></div><div className="mt-8 space-y-3">{events.length ? events.map((event) => <Card key={event.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-extrabold capitalize text-ink">{event.action.toLowerCase().replaceAll("_", " ")}</p><p className="mt-1 text-sm text-slate-500">{event.actorName || event.actorEmail || "System"} · {event.entityType}</p>{event.details && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">{JSON.stringify(event.details)}</p>}</div><time className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</time></div></Card>) : <Card className="p-10 text-center"><p className="font-bold text-ink">No work has been recorded yet.</p></Card>}</div></div>;
  */
}
function Access() { return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">Only a super administrator can view the complete audit history.</p></div>; }
