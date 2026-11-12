"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { DiscoveryMedia, isDiscoveryVideo } from "@/features/discoveries/components/discovery-media";
import "./discovery-design.css";

type Discovery = {
  id: string;
  title: string;
  description: string;
  imageBase64: string;
  link: string | null;
};

async function fetchDiscoveries(offset: number) {
  const response = await fetch(`/api/discoveries?offset=${offset}`);
  if (!response.ok) throw new Error("Could not load discoveries");

  return {
    items: (await response.json()) as Discovery[],
    hasMore: response.headers.get("X-Has-More") === "true",
  };
}

export default function DiscoveriesPage() {
  const [items, setItems] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const page = await fetchDiscoveries(0);
        if (!active) return;
        setItems(page.items);
        setNextOffset(page.items.length);
        setHasMore(page.hasMore);
      } catch {
        if (active) setError("Could not load discoveries. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitial();
    return () => { active = false; };
  }, []);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await fetchDiscoveries(nextOffset);
      setItems((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !existingIds.has(item.id))];
      });
      setNextOffset(nextOffset + page.items.length);
      setHasMore(page.hasMore);
    } catch {
      setError("Could not load discoveries. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="discovery-page">
      <div className="discovery-page-inner">
      <header className="discovery-page-heading">
        <p className="discovery-page-label">Local discoveries</p>
        <h1>What&apos;s new around Rwanda</h1>
        <p>Offers, openings, videos, and announcements from local organisations.</p>
      </header>

      {loading ? (
        <div aria-label="Loading discoveries" className="discovery-page-grid" role="status">
          {[1, 2, 3].map((item) => <div className="discovery-page-skeleton" key={item} />)}
        </div>
      ) : items.length ? (
        <div className="discovery-page-grid">
          {items.map((item) => {
            const hasBannerCopy = Boolean(item.title || item.description);
            return (
              <article className="discovery-page-card" key={item.id}>
                <div className="discovery-page-media">
                  <DiscoveryMedia alt={item.title || "Banner media"} className="h-full w-full" controls={isDiscoveryVideo(item.imageBase64)} fit="fill" imagePreset="discovery-card" source={item.imageBase64} />
                </div>
                {hasBannerCopy || item.link ? (
                  <div className="discovery-page-copy">
                    {isDiscoveryVideo(item.imageBase64) && <span className="discovery-page-video">Video</span>}
                    {item.title ? <h2>{item.title}</h2> : null}
                    {item.description ? <p>{item.description}</p> : null}
                    {item.link && <a href={item.link} rel="noreferrer" target="_blank">Learn more <ArrowUpRight aria-hidden="true" size={15} /></a>}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : !error ? (
        <div className="discovery-page-empty"><p>No discoveries are published yet.</p><p>Check back soon for useful local news and offers.</p></div>
      ) : null}

      {error && <p className="discovery-page-error" role="alert">{error}</p>}
      {!loading && (hasMore || (error && items.length === 0)) && (
        <div className="discovery-page-more">
          <button disabled={loadingMore} onClick={() => void loadMore()} type="button">
            {loadingMore ? "Loading..." : error && items.length === 0 ? "Try again" : "Load more"}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
