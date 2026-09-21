import { MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DirectionsButton } from "@/features/services/components/directions-button";
import { categoryLabel } from "@/features/services/service-category-copy";
import type { Service, ServiceRoute } from "@/features/services/types/service";
import { useLocale } from "@/providers/locale-provider";
import { optimizedImageUrl } from "@/lib/media-url";

const categoryColor: Record<string, string> = { HOSPITAL: "bg-red-50 text-red-700", PHARMACY: "bg-emerald-50 text-emerald-700", RESTAURANT: "bg-orange-50 text-orange-700", GARAGE: "bg-blue-50 text-blue-700", HOTEL: "bg-violet-50 text-violet-700", SCHOOL: "bg-cyan-50 text-cyan-700", BANK: "bg-indigo-50 text-indigo-700", SHOP: "bg-pink-50 text-pink-700", MARKET: "bg-amber-50 text-amber-700" };

export function ServiceCard({ onRoute, service }: { onRoute?: (route: ServiceRoute) => void; service: Service }) {
  const { locale } = useLocale();

  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">{service.imageBase64 ? <img alt={`Photo of ${service.name}`} className="h-44 w-full object-cover" decoding="async" loading="lazy" src={optimizedImageUrl(service.imageBase64, "service-card")} /> : null}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><Badge className={categoryColor[service.category] ?? "bg-slate-100 text-slate-700"}>{categoryLabel(service.category, locale)}</Badge><h3 className="mt-3 text-base font-extrabold text-ink">{service.name}</h3></div>{typeof service.distanceKm === "number" && <span className="rounded-lg bg-lake-50 px-2.5 py-1 text-xs font-bold text-lake-600">{service.distanceKm.toFixed(1)} km</span>}</div><p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />{service.address || [service.sector, service.district].filter(Boolean).join(", ")}</p><div className="mt-4 flex flex-wrap items-center gap-3">{service.phone && <a href={`tel:${service.phone}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:text-forest-900"><Phone className="h-4 w-4" />{service.phone}</a>}<DirectionsButton onRoute={onRoute} service={service} /></div></div></article>;
}
