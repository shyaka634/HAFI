"use client";

import Link from "next/link";
import { MapPinned, Megaphone, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useLocale } from "@/providers/locale-provider";

export function SiteFooter() {
  const { locale, t } = useLocale();
  const services = locale === "rw"
    ? ["Gushaka ahantu", "Kwamamaza", "Kwamamaza ibikorwa"]
    : ["Location searching", "Advertisements", "Marketing"];

  return (
    <footer className="mt-auto border-t bg-white">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 text-sm sm:px-6 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-start lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white shadow-sm"><BrandMark className="h-6 w-6" /></span>
          <div><p className="font-bold text-ink">{t("footerTitle")}</p><p className="text-xs text-slate-500">{t("footerTagline")}</p></div>
        </div>

        <div>
          <p className="font-extrabold text-ink">{locale === "rw" ? "Serivisi zacu" : "Our services"}</p>
          <ul className="mt-2 space-y-1.5 text-slate-500">
            <li className="flex items-center gap-2"><MapPinned className="h-3.5 w-3.5 text-forest-600" />{services[0]}</li>
            <li className="flex items-center gap-2"><Megaphone className="h-3.5 w-3.5 text-forest-600" />{services[1]}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-forest-600" />{services[2]}</li>
          </ul>
        </div>

        <div>
          <p className="font-extrabold text-ink">{locale === "rw" ? "Twandikire" : "Contact us"}</p>
          <div className="mt-2 flex flex-col items-start gap-1.5">
            <a className="inline-flex items-center gap-2 font-semibold text-slate-600 transition hover:text-forest-700" href="tel:+250788684086"><Phone className="h-3.5 w-3.5 text-forest-600" />+250 788 684 086</a>
            <a className="inline-flex items-center gap-2 font-semibold text-forest-700 transition hover:text-forest-900" href="https://wa.me/250788684086" rel="noreferrer" target="_blank"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 lg:justify-end">
          <Link className="hover:text-forest-700" href="/discoveries">{t("discoveries")}</Link>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-forest-600" /> {t("verifiedCommunityData")}</span>
          <span className="w-full text-xs text-slate-400 lg:text-right">© {new Date().getFullYear()} Hafi. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
