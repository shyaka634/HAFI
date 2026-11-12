"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Pencil, Plus, X } from "lucide-react";
import { AccessLoading } from "@/components/access-loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categoryLabel } from "@/features/services/service-category-copy";
import { useAppSession } from "@/providers/session-provider";

type Category = { value: string; description: string };
type CategoryResponse = { categories: Category[] };

export default function AdminCategoriesPage() {
  const { user, isLoading: checkingAccess } = useAppSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/categories?details=true", { cache: "no-store" });
    const data = await response.json().catch(() => null) as CategoryResponse | null;
    if (response.ok && data) setCategories(data.categories);
    else setNotice("Categories could not be loaded. Please refresh and try again.");
  }

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") void load();
  }, [user]);

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice(data?.error ?? "The category could not be created.");
        return;
      }
      setName("");
      setDescription("");
      setNotice("Category added. It is now available in search and service submissions.");
      window.dispatchEvent(new Event("hafi:categories-updated"));
      await load();
    } catch {
      setNotice("The category could not be created. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDescription(value: string) {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(value)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice(data?.error ?? "The category description could not be saved.");
        return;
      }
      setEditing(null);
      setEditDescription("");
      setNotice("Category description updated.");
      window.dispatchEvent(new Event("hafi:categories-updated"));
      await load();
    } catch {
      setNotice("The category description could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAccess) return <AccessLoading />;
  if (user?.role !== "SUPER_ADMIN") return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">Only a super administrator can manage service categories.</p></main>;

  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <Link className="inline-flex items-center gap-2 text-sm font-bold text-forest-700 hover:text-forest-900" href="/dashboard/admin"><ArrowLeft className="h-4 w-4" />Back to report</Link>
    <div className="mt-6"><h1 className="text-3xl font-extrabold text-ink">Manage service categories</h1><p className="mt-2 max-w-2xl text-slate-500">Add a category and the description people will see while browsing the service directory.</p></div>

    <Card className="mt-8 p-5 sm:p-6"><h2 className="font-extrabold text-ink">Add a category</h2><p className="mt-1 text-sm text-slate-500">For example: Mobile money — Send and receive money securely.</p><form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]" onSubmit={createCategory}><Input className="h-12 text-base" maxLength={50} onChange={(event) => setName(event.target.value)} placeholder="Category name" required value={name} /><Input className="h-12 text-base" maxLength={240} onChange={(event) => setDescription(event.target.value)} placeholder="Category description" required value={description} /><Button className="min-w-[170px] shrink-0 whitespace-nowrap" disabled={saving} size="lg" type="submit"><Plus className="h-5 w-5" />{saving ? "Adding..." : "Add category"}</Button></form>{notice ? <p className="mt-4 text-sm font-bold text-forest-700" role="status">{notice}</p> : null}</Card>

    <section className="mt-8"><div><h2 className="text-xl font-extrabold text-ink">Available categories</h2><p className="mt-1 text-sm text-slate-500">{categories.length} categories in the directory. Edit a description at any time.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{categories.map((category) => <Card className="p-5" key={category.value}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-extrabold text-ink">{categoryLabel(category.value, "en")}</h3><p className="mt-1 text-xs font-semibold tracking-wide text-slate-500">{category.value}</p></div>{editing === category.value ? null : <Button onClick={() => { setEditing(category.value); setEditDescription(category.description); }} size="sm" type="button" variant="secondary"><Pencil className="h-4 w-4" />Edit</Button>}</div>{editing === category.value ? <form className="mt-4" onSubmit={(event) => { event.preventDefault(); void saveDescription(category.value); }}><label className="block text-sm font-bold text-slate-700">Category description<textarea className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-ink outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-50" maxLength={240} onChange={(event) => setEditDescription(event.target.value)} required value={editDescription} /></label><div className="mt-3 flex gap-2"><Button disabled={saving} size="sm" type="submit">{saving ? "Saving..." : "Save description"}</Button><Button disabled={saving} onClick={() => { setEditing(null); setEditDescription(""); }} size="sm" type="button" variant="ghost"><X className="h-4 w-4" />Cancel</Button></div></form> : <p className="mt-4 text-sm leading-6 text-slate-600">{category.description}</p>}</Card>)}</div></section>
  </main>;
}
