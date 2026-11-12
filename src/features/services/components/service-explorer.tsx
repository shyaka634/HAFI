"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Crosshair, Map, Search } from "lucide-react";
import { RWANDA_DISTRICTS } from "@/lib/rwanda";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/types";
import { useLocale } from "@/providers/locale-provider";
import { ServiceCard } from "@/features/services/components/service-card";
import { DiscoveryMedia } from "@/features/discoveries/components/discovery-media";
import { categoryDescription, categoryLabel } from "@/features/services/service-category-copy";
import { loadHomeData } from "@/lib/home-data-client";
import type { PublicDiscovery } from "@/lib/public-discovery";
import type { Service, ServiceRoute } from "@/features/services/types/service";

const ServiceMap = dynamic(() => import("@/features/services/components/service-map").then((module) => module.ServiceMap), { ssr: false, loading: () => <div className="h-full animate-pulse bg-slate-100" /> });

const homeCopy = {
  en: {
    searchTitle: "Search services across Rwanda", searchPlaceholder: "Search by name...", allCategories: "All categories", allDistricts: "All districts", search: "Search", searching: "Searching...", useLocation: "Use my location", locationHint: "Your location is used only to find services within 10 km.", locationUnsupported: "Location is not supported by this browser.", locationDenied: "Allow location access to find services near you.", browse: "Browse by category", categoryHeading: "Choose a service category", categoryHint: "Select a category to search the trusted directory.", nearby: "Nearby services", results: "Service results", placesFound: "places found", startOver: "Start over", noNearby: "No services were found within 10 km.", noResults: "No matching services yet.", searchTip: "Try a broader search, another district, or a different category.", mapView: "Map view", mapHint: "Explore service locations", discoveries: "Discoveries", offers: "Local offers and news", viewAll: "View all", discoveryHint: "Announcements selected by the platform team.", viewOffer: "View offer", noDiscoveries: "No discoveries are published yet.", discoveryEmptyHint: "New announcements will appear here.",
  },
  rw: {
    searchTitle: "Shakisha serivisi mu Rwanda", searchPlaceholder: "Shakisha ukoresheje izina...", allCategories: "Ibyiciro byose", allDistricts: "Uturere twose", search: "Shaka", searching: "Birashakishwa...", useLocation: "Koresha aho ndi", locationHint: "Aho uri hakoreshwa gusa mu gushaka serivisi ziri muri km 10.", locationUnsupported: "Mushakisha yawe ntishyigikira kumenya aho uri.", locationDenied: "Emerera porogaramu kumenya aho uri kugira ngo ubone serivisi ziri hafi yawe.", browse: "Shakisha ukoresheje icyiciro", categoryHeading: "Hitamo icyiciro cya serivisi", categoryHint: "Hitamo icyiciro ushakishe serivisi zizewe.", nearby: "Serivisi ziri hafi", results: "Ibisubizo by'ishakisha", placesFound: "serivisi zabonetse", startOver: "Tangira bundi bushya", noNearby: "Nta serivisi yabonetse muri km 10.", noResults: "Nta serivisi ijyanye n'ishakisha yabonetse.", searchTip: "Gerageza ijambo rusange, akandi karere, cyangwa ikindi cyiciro.", mapView: "Ikarita", mapHint: "Reba aho serivisi ziherereye", discoveries: "Kwamamaza", offers: "Kwamamaza n'amakuru yo mu gace", viewAll: "Reba byose", discoveryHint: "Kwamamaza n'amatangazo byatoranyijwe n'itsinda ry'urubuga.", viewOffer: "Reba itangazo", noDiscoveries: "Kwamamaza ntirashyirwaho.", discoveryEmptyHint: "Kwamamaza gishya kizagaragara hano.",
  },
} as const;

type SearchOptions = Partial<{ category: ServiceCategory | ""; name: string; district: string; nearby: boolean }>;
type Discovery = PublicDiscovery;

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
  const [hasMoreDiscoveries, setHasMoreDiscoveries] = useState(false);
  const [discoveriesLoading, setDiscoveriesLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([...SERVICE_CATEGORIES]);

  useEffect(() => {
    let active = true;
    loadHomeData()
      .then((data) => {
        if (!active) return;
        setDiscoveries(data.discoveries.side);
        setHasMoreDiscoveries(data.discoveries.sideHasMore);
        if (data.categories.length) setCategories(data.categories);
      })
      .catch(() => { if (active) setDiscoveries([]); })
      .finally(() => { if (active) setDiscoveriesLoading(false); });
    return () => { active = false; };
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
    <section className="hafi-home">
      <div className="hafi-home-container">
        <div className="hafi-search">
          <h1 className="hafi-search-title">{copy.searchTitle}</h1>
          <form className="hafi-search-form" onSubmit={(event) => { event.preventDefault(); search(); }}>
            <div className="hafi-search-input"><Search aria-hidden="true" size={18} /><input aria-label={copy.searchPlaceholder} onChange={(event) => setName(event.target.value)} placeholder={copy.searchPlaceholder} value={name} /></div>
            <button className="hafi-location-button" disabled={searching} onClick={useLocation} type="button"><Crosshair aria-hidden="true" size={17} />{copy.useLocation}</button>
            <select aria-label={copy.allCategories} onChange={(event) => setCategory(event.target.value as ServiceCategory | "")} value={category}><option value="">{copy.allCategories}</option>{categories.map((value) => <option key={value} value={value}>{categoryLabel(value, locale)}</option>)}</select>
            <select aria-label={copy.allDistricts} onChange={(event) => setDistrict(event.target.value)} value={district}><option value="">{copy.allDistricts}</option>{RWANDA_DISTRICTS.map((item) => <option key={item}>{item}</option>)}</select>
            <button className="hafi-search-button" disabled={searching} type="submit"><Search aria-hidden="true" size={17} />{searching ? copy.searching : copy.search}</button>
          </form>
          <p className="hafi-search-hint">{copy.locationHint}</p>
          {error && <p className="hafi-search-error" role="alert">{error}</p>}
        </div>

        {!searched && <div className="hafi-directory-grid">
          <section>
            <div className="hafi-section-heading"><h2>{copy.categoryHeading}</h2></div>
            <div className="hafi-category-list">{categories.map((value) => <button className="hafi-category-row" key={value} onClick={() => { setCategory(value); search({ category: value }); }} type="button"><span><span className="hafi-category-name">{categoryLabel(value, locale)}</span><span className="hafi-category-description">{categoryDescription(value, locale)}</span></span><ArrowRight aria-hidden="true" className="hafi-category-arrow" size={17} /></button>)}</div>
          </section>
          <DiscoveryRail copy={copy} hasMore={hasMoreDiscoveries} items={discoveries} loading={discoveriesLoading} />
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
    <main className="hafi-results min-h-[calc(100vh-186px)]">
      <section className="grid min-h-[calc(100vh-186px)] lg:grid-cols-[minmax(360px,0.78fr)_minmax(0,1.42fr)]">
        <div className="hafi-results-panel px-4 py-7 sm:px-6 lg:h-[calc(100vh-186px)] lg:overflow-y-auto lg:px-8">
          <div className="hafi-results-heading">
            <div><p>{nearbySearch ? copy.nearby : copy.results}</p><h2>{locale === "rw" ? `Serivisi ${results.length} zabonetse` : `${results.length} ${copy.placesFound}`}</h2></div>
            <button className="hafi-results-reset" onClick={onStartOver} type="button">{copy.startOver}</button>
          </div>
          <div className="hafi-results-list">
            {results.length ? results.map((service) => <ServiceCard key={service.id} onRoute={showRoute} service={service} />) : <div className="hafi-results-empty"><p>{nearbySearch ? copy.noNearby : copy.noResults}</p><p>{copy.searchTip}</p></div>}
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

function DiscoveryRail({ copy, hasMore, items, loading }: { copy: (typeof homeCopy)["en"] | (typeof homeCopy)["rw"]; hasMore: boolean; items: Discovery[]; loading: boolean }) {
  return (
    <aside className="hafi-discoveries">
      <div className="hafi-discoveries-inner">
      <div className="hafi-section-heading"><h2>{copy.offers}</h2></div>
      <div aria-label={copy.offers} className="hafi-discoveries-list" role="region" tabIndex={0}>
        {loading ? [1, 2, 3].map((item) => <div className="hafi-discovery-skeleton animate-pulse" key={item} />) : null}
        {!loading && items.length ? items.slice(0, 15).map((item) => {
          const href = item.link ?? "/discoveries";
          const hasBannerCopy = Boolean(item.title || item.description);

          return (
            <a
              className="hafi-discovery-card"
              href={href}
              key={item.id}
              rel={item.link ? "noreferrer" : undefined}
              target={item.link ? "_blank" : undefined}
            >
              <span className="hafi-discovery-media"><DiscoveryMedia alt={item.title || copy.offers} className="hafi-discovery-image" fit="fill" imagePreset="side-banner" source={item.imageBase64} /></span>
              {hasBannerCopy ? <span className="hafi-discovery-copy">
                {item.title ? <span className="hafi-discovery-title">{item.title}</span> : null}
                {item.description ? <span className="hafi-discovery-description">{item.description}</span> : null}
                <span className="hafi-discovery-action">{copy.viewOffer} <ArrowUpRight aria-hidden="true" size={14} /></span>
              </span> : null}
            </a>
          );
        }) : null}
        {!loading && !items.length ? <div className="hafi-discovery-empty"><p>{copy.noDiscoveries}</p><span>{copy.discoveryEmptyHint}</span></div> : null}
        {!loading && hasMore ? <div className="hafi-discoveries-more"><Link href="/discoveries">{copy.viewAll}<ArrowUpRight aria-hidden="true" size={14} /></Link></div> : null}
      </div>
      </div>
    </aside>
  );
}
