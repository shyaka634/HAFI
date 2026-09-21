import type { BuiltInServiceCategory, ServiceCategory } from "@/lib/types";

type Locale = "en" | "rw";

export const serviceCategoryCopy: Record<BuiltInServiceCategory, Record<Locale, { name: string; description: string }>> = {
  HOSPITAL: { en: { name: "Hospitals", description: "Health care and clinics" }, rw: { name: "Ibitaro", description: "Serivisi z'ubuvuzi n'amavuriro" } },
  PHARMACY: { en: { name: "Pharmacies", description: "Medicine and health supplies" }, rw: { name: "Farumasi", description: "Imiti n'ibikoresho by'ubuvuzi" } },
  RESTAURANT: { en: { name: "Restaurants", description: "Food and dining" }, rw: { name: "Resitora", description: "Amafunguro n'ubusabane" } },
  GARAGE: { en: { name: "Garages", description: "Vehicle repairs and maintenance" }, rw: { name: "Garaje", description: "Gusana no kwita ku binyabiziga" } },
  HOTEL: { en: { name: "Hotels", description: "Stay and accommodation" }, rw: { name: "Amahoteri", description: "Aho gucumbika" } },
  MARKET: { en: { name: "Markets", description: "Fresh food and daily shopping" }, rw: { name: "Amasoko", description: "Ibiribwa bishya n'ibikenerwa buri munsi" } },
  SCHOOL: { en: { name: "Schools", description: "Education and learning" }, rw: { name: "Amashuri", description: "Uburezi no kwiga" } },
  BANK: { en: { name: "Banks", description: "Banking and financial services" }, rw: { name: "Amabanki", description: "Serivisi z'imari n'amabanki" } },
  SHOP: { en: { name: "Shops", description: "Local stores and businesses" }, rw: { name: "Amaduka", description: "Amaduka n'ubucuruzi bwo mu gace" } },
};

function fallbackLabel(category: ServiceCategory) {
  return category
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function categoryLabel(category: ServiceCategory, locale: Locale) {
  return serviceCategoryCopy[category as BuiltInServiceCategory]?.[locale].name ?? fallbackLabel(category);
}

export function categoryDescription(category: ServiceCategory, locale: Locale) {
  return serviceCategoryCopy[category as BuiltInServiceCategory]?.[locale].description
    ?? (locale === "rw" ? "Serivisi z'ingenzi zo mu gace" : "Trusted local services");
}
