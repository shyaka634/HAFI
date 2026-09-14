"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const messages = {
  en: { home: "Home", discoveries: "Discoveries", manageDiscoveries: "Manage Discoveries", dashboard: "Dashboard", signIn: "Sign in", signUp: "Create account", signOut: "Sign out", findServices: "Find services across Rwanda", nearYou: "Near you", submit: "Submit location", review: "Review changes", team: "Manage team", history: "Activity history", language: "Language", english: "English", kinyarwanda: "Kinyarwanda", videoBannerAd: "Video banner ad", latestOffers: "Discover Rwanda's latest offers", latestOffersDescription: "See useful local announcements, offers, and updates from organisations across Rwanda.", viewOffer: "View offer", useLightMode: "Use light mode", useDarkMode: "Use dark mode", toggleNavigation: "Toggle navigation", hideNavigation: "Hide navigation", showNavigation: "Show navigation", brandTagline: "Trusted services near you.", footerTitle: "Hafi", footerTagline: "Trusted services near you.", verifiedCommunityData: "Verified community data" },
  rw: { home: "Ahabanza", discoveries: "Kwamamaza", manageDiscoveries: "Cunga amatangazo", dashboard: "Imbonerahamwe", signIn: "Injira", signUp: "Fungura konti", signOut: "Sohoka", findServices: "Shaka serivisi mu Rwanda", nearYou: "Hafi yawe", submit: "Ohereza aho serivisi iri", review: "Emeza impinduka", team: "Cunga abakozi", history: "Amateka y'akazi", language: "Ururimi", english: "Icyongereza", kinyarwanda: "Ikinyarwanda", videoBannerAd: "Kwamamaza rya videwo", latestOffers: "Reba amatangazo mashya yo mu Rwanda", latestOffersDescription: "Reba amatangazo, ibyifuzo n'amakuru by'ingenzi biturutse mu bigo byo mu Rwanda.", viewOffer: "Reba itangazo", useLightMode: "Koresha isura y'umucyo", useDarkMode: "Koresha isura yijimye", toggleNavigation: "Hindura ibiri ku murongo", hideNavigation: "Hisha umurongo w'ubuyobozi", showNavigation: "Erekana umurongo w'ubuyobozi", brandTagline: "Serivisi zizewe hafi yawe.", footerTitle: "Hafi", footerTagline: "Serivisi zizewe hafi yawe.", verifiedCommunityData: "Amakuru yemejwe n'abaturage" },
} as const;

type Locale = keyof typeof messages;
type MessageKey = keyof (typeof messages)["en"];
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string } | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => messages[locale][key] }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider.");
  return context;
}
