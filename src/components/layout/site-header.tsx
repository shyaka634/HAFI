"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Globe2, Menu, MessageCircle, Moon, Sun, X } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { DiscoveryMedia } from "@/features/discoveries/components/discovery-media";
import { useLocale } from "@/providers/locale-provider";
import { useAppSession } from "@/providers/session-provider";
import { loadHomeData } from "@/lib/home-data-client";
import type { PublicDiscovery } from "@/lib/public-discovery";
import "./site-header-design.css";

type HeaderDiscovery = PublicDiscovery;

type TopPlacement = "TOP" | "TOP_SECONDARY";

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const { clearSession, user } = useAppSession();
  const [open, setOpen] = useState(false);
  const [navigationVisible, setNavigationVisible] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [topBanners, setTopBanners] = useState<Record<TopPlacement, HeaderDiscovery[]>>({ TOP: [], TOP_SECONDARY: [] });
  const [rightBannerIndex, setRightBannerIndex] = useState(0);

  const loadTopBanners = useCallback(async (fresh = false) => {
    try {
      const data = await loadHomeData({ fresh });
      setTopBanners({ TOP: data.discoveries.top, TOP_SECONDARY: data.discoveries.topSecondary });
    } catch {
      setTopBanners({ TOP: [], TOP_SECONDARY: [] });
    }
  }, []);

  useEffect(() => {
    void loadTopBanners();
  }, [loadTopBanners]);

  useEffect(() => {
    const refreshBanners = () => { void loadTopBanners(true); };
    window.addEventListener("hafi:discoveries-updated", refreshBanners);
    return () => window.removeEventListener("hafi:discoveries-updated", refreshBanners);
  }, [loadTopBanners]);

  useEffect(() => {
    const banners = topBanners.TOP_SECONDARY;
    if (banners.length < 2) {
      setRightBannerIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setRightBannerIndex((current) => (current + 1) % banners.length);
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [topBanners.TOP_SECONDARY]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("rwanda-service-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme);
  }, []);

  useEffect(() => {
    setNavigationVisible(window.localStorage.getItem("rwanda-service-navigation") !== "hidden");
  }, []);

  const links = [
    { href: "/", label: t("home") },
    ...(user ? [{ href: "/dashboard", label: t("dashboard") }] : []),
    ...(user?.role === "AGENT" ? [{ href: "/submit-service", label: t("submit") }] : []),
    ...(["PROVINCE_MANAGER", "SUPER_ADMIN"].includes(user?.role ?? "") ? [{ href: "/admin/verify", label: t("review") }] : []),
    ...(user?.role === "SUPER_ADMIN" ? [
      { href: "/admin/team", label: t("team") },
      { href: "/admin/categories", label: t("manageCategories") },
      { href: "/admin/discoveries", label: t("manageDiscoveries") },
      { href: "/admin/activity", label: t("history") },
    ] : []),
  ];

  function applyTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("rwanda-service-theme", nextTheme);
  }

  async function signOut() {
    await authClient.signOut();
    clearSession();
    window.location.assign("/");
  }

  function toggleNavigationVisibility() {
    setNavigationVisible((visible) => {
      const next = !visible;
      window.localStorage.setItem("rwanda-service-navigation", next ? "visible" : "hidden");
      if (!next) setOpen(false);
      return next;
    });
  }

  function resetHomeSearch() {
    if (pathname === "/") window.dispatchEvent(new Event("hafi:home-reset"));
  }

  const themeLabel = theme === "dark" ? t("useLightMode") : t("useDarkMode");
  const navigationLabel = navigationVisible ? t("hideNavigation") : t("showNavigation");

  if (pathname === "/") return (
    <>
      <header className="hafi-home-header">
        <div className="hafi-home-header-inner">
          <Link className="hafi-home-brand" href="/" onClick={() => { resetHomeSearch(); setOpen(false); }}>
            <BrandMark className="h-8 w-8 shrink-0" />
            <span><strong>Hafi</strong><small>{t("brandTagline")}</small></span>
          </Link>
          {navigationVisible && <nav aria-label={t("toggleNavigation")} className="hafi-home-nav">
            {links.map((link) => <Link href={link.href} key={link.href} onClick={link.href === "/" ? resetHomeSearch : undefined}>{link.label}</Link>)}
          </nav>}
          <div className="hafi-home-header-actions">
            <button aria-label={navigationLabel} aria-pressed={navigationVisible} className="hafi-header-icon" onClick={toggleNavigationVisibility} title={navigationLabel} type="button">{navigationVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
            {navigationVisible && <>
              <button aria-label={themeLabel} className="hafi-header-icon" onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} title={themeLabel} type="button">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
              <div aria-label={t("language")} className="hafi-language" role="group"><button aria-pressed={locale === "en"} onClick={() => setLocale("en")} type="button">EN</button><button aria-pressed={locale === "rw"} onClick={() => setLocale("rw")} type="button">RW</button></div>
              {user ? <button className="hafi-header-signin" onClick={signOut} type="button">{t("signOut")}</button> : <Link className="hafi-header-signin" href="/sign-in">{t("signIn")}</Link>}
              <button aria-expanded={open} aria-label={t("toggleNavigation")} className="hafi-header-icon hafi-mobile-menu" onClick={() => setOpen(!open)} type="button">{open ? <X size={18} /> : <Menu size={18} />}</button>
            </>}
          </div>
        </div>
        {navigationVisible && open && <nav aria-label={t("toggleNavigation")} className="hafi-home-mobile-nav">{links.map((link) => <Link href={link.href} key={link.href} onClick={() => { if (link.href === "/") resetHomeSearch(); setOpen(false); }}>{link.label}</Link>)}</nav>}
      </header>
      <div className="hafi-home-banners"><div className="hafi-home-banner-grid">
        <HomeBanner discovery={topBanners.TOP[0] ?? null} fallbackDescription={t("latestOffersDescription")} fallbackTitle={t("latestOffers")} />
        <HomeBanner discovery={topBanners.TOP_SECONDARY[rightBannerIndex] ?? null} fallbackDescription={t("latestOffersDescription")} fallbackTitle={t("discoveries")} />
      </div></div>
      <Link aria-label={t("feedback")} className="hafi-feedback-fab" href="/feedback" title={t("feedback")}>
        <MessageCircle aria-hidden="true" size={26} />
        <span>{t("feedback")}</span>
      </Link>
    </>
  );

  return (
    <header className="hafi-interior-header sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:grid-cols-[auto_auto_minmax(0,1fr)] lg:items-center lg:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3 lg:contents">
          <Link className="hafi-interior-brand flex min-w-0 items-center gap-3" href="/" onClick={() => { resetHomeSearch(); setOpen(false); }}>
            <span className="hafi-interior-brand-mark grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-lg shadow-forest-600/20">
              <BrandMark className="h-8 w-8" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-extrabold tracking-tight text-ink">Hafi</span>
              <span className="block -mt-0.5 truncate text-sm font-medium text-forest-700">{t("brandTagline")}</span>
            </span>
          </Link>
          <button aria-label={navigationLabel} aria-pressed={navigationVisible} className="hafi-interior-control grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700" onClick={toggleNavigationVisibility} title={navigationLabel} type="button">
            {navigationVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <HeaderBanner discovery={topBanners.TOP[0] ?? null} fallbackDescription={t("latestOffersDescription")} fallbackTitle={t("latestOffers")} />
          <HeaderBanner discovery={topBanners.TOP_SECONDARY[rightBannerIndex] ?? null} fallbackDescription={t("latestOffersDescription")} fallbackTitle={t("discoveries")} />
        </div>
      </div>

      {navigationVisible ? <div className="hafi-interior-nav-bar border-t border-slate-200/80 bg-white/75">
        <div className="mx-auto flex min-h-[62px] max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <nav className="hafi-interior-links hidden min-w-0 items-center gap-1 lg:flex">
            {links.map((link) => <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink" href={link.href} key={link.href} onClick={link.href === "/" ? resetHomeSearch : undefined}>{link.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label={themeLabel} className="hafi-interior-control grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700" onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} title={themeLabel} type="button">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <label className="sr-only">{t("language")}</label>
            <div className="hafi-interior-language hidden items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:flex">
              <Globe2 className="ml-1 h-4 w-4 text-slate-500" />
              <button className={`rounded-md px-2 py-1 text-xs font-bold ${locale === "en" ? "bg-slate-100 text-ink" : "text-slate-500"}`} onClick={() => setLocale("en")}>EN</button>
              <button className={`rounded-md px-2 py-1 text-xs font-bold ${locale === "rw" ? "bg-slate-100 text-ink" : "text-slate-500"}`} onClick={() => setLocale("rw")}>RW</button>
            </div>
            {user ? <Button className="hafi-interior-signin" onClick={signOut} size="sm" variant="secondary">{t("signOut")}</Button> : <Link className="hafi-interior-signin text-sm font-bold text-slate-600 hover:text-ink" href="/sign-in">{t("signIn")}</Link>}
            <button aria-expanded={open} aria-label={t("toggleNavigation")} className="hafi-interior-control grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} type="button">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div> : null}

      {open ? <div className="hafi-interior-mobile border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
        <nav className="hafi-interior-links mx-auto flex max-w-7xl flex-col gap-1">
          {links.map((link) => <Link className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100" href={link.href} key={link.href} onClick={() => { if (link.href === "/") resetHomeSearch(); setOpen(false); }}>{link.label}</Link>)}
          <div className="mt-2 flex items-center gap-2 border-t pt-3 sm:hidden">
            <Button onClick={() => setLocale("en")} size="sm" variant={locale === "en" ? "primary" : "secondary"}>EN</Button>
            <Button onClick={() => setLocale("rw")} size="sm" variant={locale === "rw" ? "primary" : "secondary"}>RW</Button>
          </div>
        </nav>
      </div> : null}
    </header>
  );
}

function HomeBanner({ discovery, fallbackDescription, fallbackTitle }: { discovery: HeaderDiscovery | null; fallbackDescription: string; fallbackTitle: string }) {
  return <a className="hafi-home-banner" href={discovery?.link ?? "/discoveries"} rel={discovery?.link ? "noreferrer" : undefined} target={discovery?.link ? "_blank" : undefined}>
    {discovery?.imageBase64 ? <span className="hafi-home-banner-media"><DiscoveryMedia alt={fallbackTitle} className="hafi-home-banner-image" fit="cover" imagePreset="header-banner" loading="eager" source={discovery.imageBase64} /></span> : null}
    {!discovery ? <span className="hafi-home-banner-copy"><strong>{fallbackTitle}</strong><span>{fallbackDescription}</span></span> : null}
  </a>;
}

function HeaderBanner({ discovery, fallbackDescription, fallbackTitle }: {
  discovery: HeaderDiscovery | null;
  fallbackDescription: string;
  fallbackTitle: string;
}) {
  const href = discovery?.link ?? "/discoveries";

  return (
    <a
      className="hafi-interior-banner group flex min-h-[112px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-forest-200"
      href={href}
      rel={discovery?.link ? "noreferrer" : undefined}
      target={discovery?.link ? "_blank" : undefined}
    >
      {discovery?.imageBase64 ? <span className="relative block aspect-[16/5] w-full bg-slate-100"><DiscoveryMedia alt={fallbackTitle} className="absolute inset-0 h-full w-full" fit="cover" imagePreset="header-banner" loading="eager" source={discovery.imageBase64} /></span> : null}
      {!discovery ? <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
        <span className="block break-words text-sm font-bold text-ink">{fallbackTitle}</span>
        <span className="mt-1 block break-words text-xs leading-5 text-slate-500">{fallbackDescription}</span>
      </span> : null}
    </a>
  );
}
