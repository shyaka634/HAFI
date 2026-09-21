"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Globe2, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { DiscoveryMedia } from "@/features/discoveries/components/discovery-media";
import { useLocale } from "@/providers/locale-provider";
import { useAppSession } from "@/providers/session-provider";

type HeaderDiscovery = {
  id: string;
  title: string;
  description: string;
  imageBase64: string;
  link: string | null;
  placement: "TOP" | "TOP_SECONDARY" | "SIDE";
};

type TopPlacement = "TOP" | "TOP_SECONDARY";

export function SiteHeader() {
  const { locale, setLocale, t } = useLocale();
  const { clearSession, user } = useAppSession();
  const [open, setOpen] = useState(false);
  const [navigationVisible, setNavigationVisible] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [topBanners, setTopBanners] = useState<Record<TopPlacement, HeaderDiscovery[]>>({ TOP: [], TOP_SECONDARY: [] });
  const [rightBannerIndex, setRightBannerIndex] = useState(0);

  const loadTopBanners = useCallback(async (fresh = false) => {
    const refreshQuery = fresh ? `&refresh=${Date.now()}` : "";
    try {
      const entries = await Promise.all(
        (["TOP", "TOP_SECONDARY"] as const).map(async (placement) => {
          const response = await fetch(`/api/discoveries?placement=${placement}${refreshQuery}`, fresh ? { cache: "no-store" } : undefined);
          const items = response.ok ? await response.json() as HeaderDiscovery[] : [];
          return [placement, items] as const;
        }),
      );
      setTopBanners(Object.fromEntries(entries) as Record<TopPlacement, HeaderDiscovery[]>);
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

  const themeLabel = theme === "dark" ? t("useLightMode") : t("useDarkMode");
  const navigationLabel = navigationVisible ? t("hideNavigation") : t("showNavigation");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:grid-cols-[auto_auto_minmax(0,1fr)] lg:items-center lg:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3 lg:contents">
          <Link className="flex min-w-0 items-center gap-3" href="/" onClick={() => setOpen(false)}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-lg shadow-forest-600/20">
              <BrandMark className="h-8 w-8" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-extrabold tracking-tight text-ink">Hafi</span>
              <span className="block -mt-0.5 truncate text-sm font-medium text-forest-700">{t("brandTagline")}</span>
            </span>
          </Link>
          <button aria-label={navigationLabel} aria-pressed={navigationVisible} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700" onClick={toggleNavigationVisibility} title={navigationLabel} type="button">
            {navigationVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <HeaderBanner actionLabel={t("viewOffer")} discovery={topBanners.TOP[0] ?? null} fallbackDescription={t("latestOffersDescription")} fallbackTitle={t("latestOffers")} label={t("videoBannerAd")} />
          <HeaderBanner actionLabel={t("viewOffer")} discovery={topBanners.TOP_SECONDARY[rightBannerIndex] ?? null} fallbackDescription={t("latestOffersDescription")} fallbackTitle={t("discoveries")} label={t("videoBannerAd")} />
        </div>
      </div>

      {navigationVisible ? <div className="border-t border-slate-200/80 bg-white/75">
        <div className="mx-auto flex min-h-[62px] max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <nav className="hidden min-w-0 items-center gap-1 lg:flex">
            {links.map((link) => <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink" href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label={themeLabel} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700" onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} title={themeLabel} type="button">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <label className="sr-only">{t("language")}</label>
            <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:flex">
              <Globe2 className="ml-1 h-4 w-4 text-slate-500" />
              <button className={`rounded-md px-2 py-1 text-xs font-bold ${locale === "en" ? "bg-slate-100 text-ink" : "text-slate-500"}`} onClick={() => setLocale("en")}>EN</button>
              <button className={`rounded-md px-2 py-1 text-xs font-bold ${locale === "rw" ? "bg-slate-100 text-ink" : "text-slate-500"}`} onClick={() => setLocale("rw")}>RW</button>
            </div>
            {user ? <Button onClick={signOut} size="sm" variant="secondary">{t("signOut")}</Button> : <Link className="text-sm font-bold text-slate-600 hover:text-ink" href="/sign-in">{t("signIn")}</Link>}
            <button aria-label={t("toggleNavigation")} className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} type="button">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div> : null}

      {open ? <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
        <nav className="mx-auto flex max-w-7xl flex-col gap-1">
          {links.map((link) => <Link className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100" href={link.href} key={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
          <div className="mt-2 flex items-center gap-2 border-t pt-3 sm:hidden">
            <Button onClick={() => setLocale("en")} size="sm" variant={locale === "en" ? "primary" : "secondary"}>EN</Button>
            <Button onClick={() => setLocale("rw")} size="sm" variant={locale === "rw" ? "primary" : "secondary"}>RW</Button>
          </div>
        </nav>
      </div> : null}
    </header>
  );
}

function HeaderBanner({ actionLabel, discovery, fallbackDescription, fallbackTitle, label }: {
  actionLabel: string;
  discovery: HeaderDiscovery | null;
  fallbackDescription: string;
  fallbackTitle: string;
  label: string;
}) {
  const href = discovery?.link ?? "/discoveries";
  const hasBannerCopy = Boolean(discovery?.title || discovery?.description);

  return (
    <a
      className="group relative flex min-h-[112px] min-w-0 overflow-hidden rounded-2xl border border-forest-100 bg-forest-900 transition hover:border-forest-200 sm:min-h-[124px] lg:min-h-[112px]"
      href={href}
      rel={discovery?.link ? "noreferrer" : undefined}
      target={discovery?.link ? "_blank" : undefined}
    >
      {discovery?.imageBase64 ? <DiscoveryMedia alt="" className="absolute inset-0 h-full w-full object-fill opacity-100 transition duration-500 group-hover:opacity-100" imagePreset="header-banner" loading="eager" source={discovery.imageBase64} /> : null}
      {!discovery || hasBannerCopy ? <>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-4/5 bg-gradient-to-r from-slate-950/75 via-slate-950/35 to-transparent" />
        <span className="relative flex min-w-0 flex-1 flex-col justify-center px-4 py-4 text-white sm:px-5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-100"><Sparkles className="h-3.5 w-3.5" />{discovery ? label : fallbackTitle}</span>
          {discovery?.title ? <span className="mt-1 block truncate text-base font-extrabold sm:text-lg">{discovery.title}</span> : !discovery ? <span className="mt-1 block truncate text-base font-extrabold sm:text-lg">{fallbackTitle}</span> : null}
          {discovery?.description ? <span className="mt-1 hidden max-h-10 overflow-hidden text-sm leading-5 text-forest-50 sm:block">{discovery.description}</span> : !discovery ? <span className="mt-1 hidden max-h-10 overflow-hidden text-sm leading-5 text-forest-50 sm:block">{fallbackDescription}</span> : null}
        </span>
      </> : null}
      <span className="relative m-auto mr-3 hidden rounded-full bg-white px-3 py-2 text-xs font-bold text-forest-700 shadow-sm transition group-hover:bg-forest-50 2xl:inline">{actionLabel}</span>
    </a>
  );
}
