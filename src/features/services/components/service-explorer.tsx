"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BedDouble, Building2, Crosshair, HeartPulse, Landmark, Map, Pill, Search, ShoppingBag, Sparkles, Tag, UtensilsCrossed, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RWANDA_DISTRICTS } from "@/lib/rwanda";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/types";
import { useLocale } from "@/providers/locale-provider";
import { ServiceCard } from "@/features/services/components/service-card";
import { DiscoveryMedia } from "@/features/discoveries/components/discovery-media";
import { categoryDescription, categoryLabel } from "@/features/services/service-category-copy";
import type { Service, ServiceRoute } from "@/features/services/types/service";

const ServiceMap = dynamic(() => import("@/features/services/components/service-map").then((module) => module.ServiceMap), { ssr: false, loading: () => <div className="h-full animate-pulse bg-slate-100" /> });

const quickCategories: { value: ServiceCategory; icon: typeof HeartPulse }[] = [
  { value: "HOSPITAL", icon: HeartPulse }, { value: "PHARMACY", icon: Pill }, { value: "RESTAURANT", icon: UtensilsCrossed },
  { value: "GARAGE", icon: Wrench }, { value: "HOTEL", icon: BedDouble }, { value: "MARKET", icon: ShoppingBag },
  { value: "SCHOOL", icon: Building2 }, { value: "BANK", icon: Landmark }, { value: "SHOP", icon: ShoppingBag },
];

const homeCopy = {
  en: {
    searchTitle: "Search services across Rwanda", searchPlaceholder: "Search by name...", allCategories: "All categories", allDistricts: "All districts", search: "Search", searching: "Searching...", useLocation: "Use my location", locationHint: "Your location is used only to find services within 10 km.", locationUnsupported: "Location is not supported by this browser.", locationDenied: "Allow location access to find services near you.", browse: "Browse by category", categoryHeading: "Choose a service category", categoryHint: "Select a category to search the trusted directory.", nearby: "Nearby services", results: "Service results", placesFound: "places found", startOver: "Start over", noNearby: "No services were found within 10 km.", noResults: "No matching services yet.", searchTip: "Try a broader search, another district, or a different category.", mapView: "Map view", mapHint: "Explore service locations", discoveries: "Discoveries", offers: "Local offers and news", viewAll: "View all", discoveryHint: "Announcements selected by the platform team.", viewOffer: "View offer", noDiscoveries: "No discoveries are published yet.", discoveryEmptyHint: "New announcements will appear here.",
  },
  rw: {
    searchTitle: "Shakisha serivisi mu Rwanda", searchPlaceholder: "Shakisha ukoresheje izina...", allCategories: "Ibyiciro byose", allDistricts: "Uturere twose", search: "Shaka", searching: "Birashakishwa...", useLocation: "Koresha aho ndi", locationHint: "Aho uri hakoreshwa gusa mu gushaka serivisi ziri muri km 10.", locationUnsupported: "Mushakisha yawe ntishyigikira kumenya aho uri.", locationDenied: "Emerera porogaramu kumenya aho uri kugira ngo ubone serivisi ziri hafi yawe.", browse: "Shakisha ukoresheje icyiciro", categoryHeading: "Hitamo icyiciro cya serivisi", categoryHint: "Hitamo icyiciro ushakishe serivisi zizewe.", nearby: "Serivisi ziri hafi", results: "Ibisubizo by'ishakisha", placesFound: "serivisi zabonetse", startOver: "Tangira bundi bushya", noNearby: "Nta serivisi yabonetse muri km 10.", noResults: "Nta serivisi ijyanye n'ishakisha yabonetse.", searchTip: "Gerageza ijambo rusange, akandi karere, cyangwa ikindi cyiciro.", mapView: "Ikarita", mapHint: "Reba aho serivisi ziherereye", discoveries: "Kwamamaza", offers: "Kwamamaza n'amakuru yo mu gace", viewAll: "Reba byose", discoveryHint: "Kwamamaza n'amatangazo byatoranyijwe n'itsinda ry'urubuga.", viewOffer: "Reba itangazo", noDiscoveries: "Kwamamaza ntirashyirwaho.", discoveryEmptyHint: "Kwamamaza gishya kizagaragara hano.",
  },
} as const;

type SearchOptions = Partial<{ category: ServiceCategory | ""; name: string; district: string; nearby: boolean }>;
type Discovery = { id: string; title: string; description: string; imageBase64: string; link: string | null; placement: "TOP" | "TOP_SECONDARY" | "SIDE" };

export function ServiceExplorer() {
  const { locale } = useLocale();
  const copy = homeCopy[locale];
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [district, setDistrict] = useState("");
  const [results, setResults] = useState<Service[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [nearbySearch, setNearbySearch] = useState(false);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [discoveriesLoading, setDiscoveriesLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([...SERVICE_CATEGORIES]);

  useEffect(() => {
    fetch("/api/discoveries?placement=SIDE").then((response) => response.ok ? response.json() : []).then((items: Discovery[]) => setDiscoveries(items)).catch(() => setDiscoveries([])).finally(() => setDiscoveriesLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { categories?: string[] } | null) => {
        if (data?.categories?.length) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  async function search(next: SearchOptions = {}, coordinates = location) {
    setSearching(true); setError("");
    const filters = { category, name, district, ...next };
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.category) params.set("category", filters.category);
    if (filters.district) params.set("district", filters.district);
    if (coordinates && !filters.district) { params.set("lat", String(coordinates.lat)); params.set("lng", String(coordinates.lng)); }
    if (filters.nearby) params.set("nearby", "true");
    try {
      const query = params.toString();
      const response = await fetch(`/api/services${query ? `?${query}` : ""}`); const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResults(data); setNearbySearch(Boolean(filters.nearby)); setSearched(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Search is unavailable."); }
    finally { setSearching(false); }
  }

  function useLocation() {
    if (!navigator.geolocation) return setError(copy.locationUnsupported);
    setSearching(true); setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => { const point = { lat: position.coords.latitude, lng: position.coords.longitude }; setLocation(point); search({ district: "", nearby: true }, point); },
      () => { setSearching(false); setError(copy.locationDenied); },
    );
  }

  return <>
    <section
      className="relative overflow-hidden bg-forest-900 bg-cover bg-center text-white"
      style={{ backgroundImage: "linear-gradient(120deg, rgba(7, 93, 59, 0.20), rgba(23, 145, 98, 0.12)), url('/images/rwanda-services-map-background.png')" }}
    >
      <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <Card className="p-5 shadow-lift sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-base font-extrabold text-ink sm:text-lg"><Search className="h-5 w-5 text-forest-700" />{copy.searchTitle}</div>
          <form className="grid gap-3 lg:grid-cols-[minmax(220px,1.55fr)_auto_1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); search(); }}>
            <div className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" /><Input className="h-12 pl-11 text-base" onChange={(event) => setName(event.target.value)} placeholder={copy.searchPlaceholder} value={name} /></div>
            <Button className="whitespace-nowrap" disabled={searching} onClick={useLocation} size="lg" type="button" variant="secondary"><Crosshair className="h-5 w-5" />{copy.useLocation}</Button>
            <select className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-600 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-50" onChange={(event) => setCategory(event.target.value as ServiceCategory | "")} value={category}><option value="">{copy.allCategories}</option>{categories.map((value) => <option key={value} value={value}>{categoryLabel(value, locale)}</option>)}</select>
            <select className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-600 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-50" onChange={(event) => setDistrict(event.target.value)} value={district}><option value="">{copy.allDistricts}</option>{RWANDA_DISTRICTS.map((item) => <option key={item}>{item}</option>)}</select>
            <Button disabled={searching} size="lg" type="submit"><Search className="h-5 w-5" />{searching ? copy.searching : copy.search}</Button>
          </form>
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-400">{copy.locationHint}</p>
          {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        </Card>

        {!searched && <div className="mt-9 grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section>
            <p className="text-sm font-bold uppercase tracking-widest text-forest-100">{copy.browse}</p>
            <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{copy.categoryHeading}</h1>
            <div className="mt-6 space-y-3">{categories.map((value) => { const Icon = quickCategories.find((item) => item.value === value)?.icon ?? Tag; return <button className="group flex w-full items-center gap-4 rounded-2xl border border-white/20 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-soft" key={value} onClick={() => { setCategory(value); search({ category: value }); }}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700 transition group-hover:bg-forest-600 group-hover:text-white"><Icon className="h-5 w-5" /></span><span><span className="block font-extrabold text-ink">{categoryLabel(value, locale)}</span><span className="mt-0.5 block text-sm text-slate-500">{categoryDescription(value, locale)}</span></span><ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:text-forest-600" /></button>; })}</div>
          </section>
          <DiscoveryRail copy={copy} items={discoveries} loading={discoveriesLoading} />
        </div>}
      </div>
    </section>

    {searched && <SearchResultsPane copy={copy} locale={locale} location={location} nearbySearch={nearbySearch} onStartOver={() => setSearched(false)} onUserLocationChange={setLocation} results={results} />}
  </>;
}

function SearchResultsPane({ copy, locale, nearbySearch, results, location, onStartOver, onUserLocationChange }: {
  copy: (typeof homeCopy)["en"] | (typeof homeCopy)["rw"];
  locale: "en" | "rw";
  nearbySearch: boolean;
  results: Service[];
  location: { lat: number; lng: number } | null;
  onStartOver: () => void;
  onUserLocationChange: (location: { lat: number; lng: number }) => void;
}) {
  const [route, setRoute] = useState<ServiceRoute | null>(null);

  function showRoute(nextRoute: ServiceRoute) {
    setRoute(nextRoute);
    onUserLocationChange(nextRoute.userLocation);
  }

  return (
    <main className="min-h-[calc(100vh-186px)]">
      <section className="grid min-h-[calc(100vh-186px)] lg:grid-cols-[minmax(360px,0.78fr)_minmax(0,1.42fr)]">
        <div className="border-b border-slate-200 px-4 py-7 sm:px-6 lg:h-[calc(100vh-186px)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-sm font-bold uppercase tracking-widest text-forest-700">{nearbySearch ? copy.nearby : copy.results}</p><h2 className="mt-1 text-2xl font-extrabold text-ink">{locale === "rw" ? `Serivisi ${results.length} zabonetse` : `${results.length} ${copy.placesFound}`}</h2></div>
            <Button onClick={onStartOver} size="sm" variant="ghost">{copy.startOver}</Button>
          </div>
          <div className="space-y-4">
            {results.length ? results.map((service) => <ServiceCard key={service.id} onRoute={showRoute} service={service} />) : <Card className="p-8 text-center"><p className="font-bold text-ink">{nearbySearch ? copy.noNearby : copy.noResults}</p><p className="mt-2 text-sm text-slate-500">{copy.searchTip}</p></Card>}
          </div>
        </div>

        <div className="relative h-[520px] overflow-hidden bg-slate-100 lg:sticky lg:top-[186px] lg:h-[calc(100vh-186px)]">
          <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-xl bg-white/95 px-4 py-3 shadow-soft">
            <p className="flex items-center gap-2 font-extrabold text-ink"><Map className="h-4 w-4 text-forest-600" />{copy.mapView}</p>
            <p className="mt-0.5 text-xs text-slate-500">{copy.mapHint}</p>
          </div>
          <DeferredServiceMap route={route} services={results} userLocation={location} />
        </div>
      </section>
    </main>
  );
}

function DeferredServiceMap({ route, services, userLocation }: { route: ServiceRoute | null; services: Service[]; userLocation: { lat: number; lng: number } | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || shouldLoad) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "240px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return <div className="h-full w-full" ref={containerRef}>
    {shouldLoad ? <ServiceMap route={route} services={services} userLocation={userLocation} /> : <div aria-live="polite" className="grid h-full place-items-center bg-slate-100 text-sm font-bold text-slate-500">Loading map…</div>}
  </div>;
}

function DiscoveryRail({ copy, items, loading }: { copy: (typeof homeCopy)["en"] | (typeof homeCopy)["rw"]; items: Discovery[]; loading: boolean }) {
  return (
    <aside>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">{copy.offers}</h2>
        </div>
        <Link className="text-sm font-bold text-white hover:text-white hover:underline" href="/discoveries">{copy.viewAll}</Link>
      </div>
      <div className="mt-5 space-y-5">
        {loading ? [1, 2, 3].map((item) => <div className="aspect-[16/7] animate-pulse rounded-2xl bg-slate-200" key={item} />) : null}
        {!loading && items.length ? items.slice(0, 3).map((item) => {
          const href = item.link ?? "/discoveries";
          const hasBannerCopy = Boolean(item.title || item.description);

          return (
            <a
              className="group relative block aspect-[16/7] overflow-hidden rounded-2xl bg-forest-900 shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
              href={href}
              key={item.id}
              rel={item.link ? "noreferrer" : undefined}
              target={item.link ? "_blank" : undefined}
            >
              <DiscoveryMedia alt="" className="absolute inset-0 h-full w-full object-fill opacity-90 transition duration-500 group-hover:opacity-100" imagePreset="side-banner" source={item.imageBase64} />
              {hasBannerCopy ? <>
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                  {item.title ? <span className="block truncate text-lg font-extrabold">{item.title}</span> : null}
                  {item.description ? <span className="mt-1 block truncate text-sm text-white/85">{item.description}</span> : null}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-forest-100">{copy.viewOffer} <ArrowUpRight className="h-4 w-4" /></span>
                </span>
              </> : null}
            </a>
          );
        }) : null}
        {!loading && !items.length ? <div className="rounded-2xl bg-slate-50 p-8 text-center"><Sparkles className="mx-auto h-6 w-6 text-lake-600" /><p className="mt-3 font-bold text-ink">{copy.noDiscoveries}</p><p className="mt-2 text-sm text-slate-500">{copy.discoveryEmptyHint}</p></div> : null}
      </div>
    </aside>
  );
}
