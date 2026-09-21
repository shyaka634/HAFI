"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ListPlus, Plus, Tag } from "lucide-react";
import { AccessLoading } from "@/components/access-loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categoryLabel } from "@/features/services/service-category-copy";
import { useAppSession } from "@/providers/session-provider";

type CategoryResponse = { categories: string[] };

export default function AdminCategoriesPage() {
  const { user, isLoading: checkingAccess } = useAppSession();
  const [categories, setCategories] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/categories");
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
        body: JSON.stringify({ name }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice(data?.error ?? "The category could not be created.");
        return;
      }
      setName("");
      setNotice("Category added. It is now available in search and service submissions.");
      await load();
    } catch {
      setNotice("The category could not be created. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAccess) return <AccessLoading />;
  if (user?.role !== "SUPER_ADMIN") return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">Only a super administrator can manage service categories.</p></main>;

  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <Link className="inline-flex items-center gap-2 text-sm font-bold text-forest-700 hover:text-forest-900" href="/dashboard/admin"><ArrowLeft className="h-4 w-4" />Back to report</Link>
    <div className="mt-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700"><ListPlus className="h-6 w-6" /></span><h1 className="mt-5 text-3xl font-extrabold text-ink">Manage service categories</h1><p className="mt-2 max-w-2xl text-slate-500">Add a category when the directory needs to cover another kind of local service. New categories become available to search and to district agents submitting a service.</p></div>

    <Card className="mt-8 p-5 sm:p-6"><h2 className="font-extrabold text-ink">Add a category</h2><p className="mt-1 text-sm text-slate-500">For example: Mobile money, Laundry, or Transport.</p><form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={createCategory}><Input className="h-12 text-base" maxLength={50} onChange={(event) => setName(event.target.value)} placeholder="Category name" required value={name} /><Button className="min-w-[170px] shrink-0 whitespace-nowrap" disabled={saving} size="lg" type="submit"><Plus className="h-5 w-5" />{saving ? "Adding..." : "Add category"}</Button></form>{notice ? <p className="mt-4 text-sm font-bold text-forest-700">{notice}</p> : null}</Card>

    <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-extrabold text-ink">Available categories</h2><p className="mt-1 text-sm text-slate-500">{categories.length} categories in the directory.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <Card className="flex items-center gap-3 p-4" key={category}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lake-50 text-lake-600"><Tag className="h-5 w-5" /></span><span className="min-w-0"><span className="block truncate font-extrabold text-ink">{categoryLabel(category, "en")}</span><span className="mt-0.5 block truncate text-xs font-semibold tracking-wide text-slate-500">{category}</span></span></Card>)}</div></section>
  </main>;
}
