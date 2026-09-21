"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DiscoveryMedia, isDiscoveryVideo } from "@/features/discoveries/components/discovery-media";

type Discovery = { id: string; title: string; description: string; imageBase64: string; link: string | null };

export default function DiscoveriesPage() {
  const [items, setItems] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discoveries").then((response) => response.json()).then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full bg-lake-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-lake-600"><Sparkles className="h-3.5 w-3.5" />Local discoveries</span><h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink">What&apos;s new around Rwanda</h1><p className="mt-4 text-lg leading-7 text-slate-500">Interactive video adverts, offers, openings, and announcements from local organisations.</p></div>{loading ? <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div className="h-80 animate-pulse rounded-2xl bg-slate-200" key={item} />)}</div> : items.length ? <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => { const hasBannerCopy = Boolean(item.title || item.description); return <Card className="group overflow-hidden" key={item.id}><div className="aspect-[16/10] bg-slate-100"><DiscoveryMedia alt={item.title || "Banner media"} className="h-full w-full transition duration-300 group-hover:scale-105" controls={isDiscoveryVideo(item.imageBase64)} imagePreset="discovery-card" source={item.imageBase64} /></div>{hasBannerCopy || item.link ? <div className="p-6"><div className="flex items-center gap-2">{item.title ? <h2 className="text-lg font-extrabold text-ink">{item.title}</h2> : null}{isDiscoveryVideo(item.imageBase64) && <span className="inline-flex items-center gap-1 rounded-full bg-lake-50 px-2 py-1 text-[10px] font-bold text-lake-600"><Video className="h-3 w-3" />Video</span>}</div>{item.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p> : null}{item.link && <a className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:text-forest-900" href={item.link} rel="noreferrer" target="_blank">Learn more <ArrowUpRight className="h-4 w-4" /></a>}</div> : null}</Card>; })}</div> : <Card className="mt-10 p-10 text-center"><p className="font-bold text-ink">No discoveries are published yet.</p><p className="mt-2 text-sm text-slate-500">Check back soon for useful local news and offers.</p></Card>}</div>;
}
