import { MapPin, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DirectionsButton } from "@/features/services/components/directions-button";
import { categoryLabel } from "@/features/services/service-category-copy";
import type { Service, ServiceRoute } from "@/features/services/types/service";
import { useLocale } from "@/providers/locale-provider";
import { optimizedImageUrl } from "@/lib/media-url";

export function ServiceCard({ onRoute, service }: { onRoute?: (route: ServiceRoute) => void; service: Service }) {
  const { locale } = useLocale();
  const aboutRef = useRef<HTMLParagraphElement>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [aboutCanExpand, setAboutCanExpand] = useState(false);

  useEffect(() => {
    const element = aboutRef.current;
    if (!element || aboutExpanded) return;

    const updateCanExpand = () => setAboutCanExpand(element.scrollHeight > element.clientHeight + 1);
    updateCanExpand();

    if (!("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(updateCanExpand);
    observer.observe(element);
    return () => observer.disconnect();
  }, [aboutExpanded, service.about]);

  const aboutId = `service-about-${service.id}`;
  const moreLabel = locale === "rw" ? "Reba byinshi" : "More";
  const lessLabel = locale === "rw" ? "Reba bike" : "Less";

  return (
    <article className="hafi-result-card">
      {service.imageBase64 ? <img alt={`Photo of ${service.name}`} className="hafi-result-image" decoding="async" loading="lazy" src={optimizedImageUrl(service.imageBase64, "service-card")} /> : null}
      <div className="hafi-result-content">
        <div className="hafi-result-meta">
          <span className="hafi-result-category">{categoryLabel(service.category, locale)}</span>
          {typeof service.distanceKm === "number" && <span className="hafi-result-distance">{service.distanceKm.toFixed(1)} km</span>}
        </div>
        <h3 className="hafi-result-name">{service.name}</h3>
        {service.about ? <>
          <p className="hafi-result-about" data-expanded={aboutExpanded} id={aboutId} ref={aboutRef}>{service.about}</p>
          {aboutCanExpand ? <button aria-controls={aboutId} aria-expanded={aboutExpanded} className="hafi-result-about-more" onClick={() => setAboutExpanded((expanded) => !expanded)} type="button">{aboutExpanded ? lessLabel : moreLabel}</button> : null}
        </> : null}
        <p className="hafi-result-address"><MapPin aria-hidden="true" size={16} />{service.address || [service.sector, service.district].filter(Boolean).join(", ")}</p>
        <div className="hafi-result-actions">
          {service.phone && <a href={`tel:${service.phone}`} className="hafi-result-phone"><Phone aria-hidden="true" size={15} />{service.phone}</a>}
          <DirectionsButton onRoute={onRoute} service={service} />
        </div>
      </div>
    </article>
  );
}
