"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Service, ServiceRoute } from "@/features/services/types/service";
import { useLocale } from "@/providers/locale-provider";

type RouteResponse = {
  distanceKm: number;
  durationMinutes: number;
  coordinates?: Array<[number, number]>;
  steps?: string[];
  error?: string;
};

export function DirectionsButton({ onRoute, service }: { onRoute?: (route: ServiceRoute) => void; service: Service }) {
  const { locale } = useLocale();
  const isRw = locale === "rw";
  const [message, setMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function getDirections() {
    if (!navigator.geolocation) {
      setMessage(isRw ? "Aho uri ntihaboneka muri mushakisha yawe." : "Location is not available in this browser.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setSteps([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            fromLat: String(position.coords.latitude),
            fromLng: String(position.coords.longitude),
            toLat: String(service.latitude),
            toLng: String(service.longitude),
          });
          const response = await fetch(`/api/directions?${params}`);
          const route = (await response.json()) as RouteResponse;

          if (!response.ok) {
            setMessage(route.error ?? (isRw ? "Amabwiriza y'inzira ntaboneka by'igihe gito." : "Directions are temporarily unavailable."));
            return;
          }

          if (route.coordinates && route.coordinates.length > 1) {
            onRoute?.({
              serviceId: service.id,
              userLocation: { lat: position.coords.latitude, lng: position.coords.longitude },
              points: route.coordinates,
            });
          }
          setMessage(isRw ? `${route.distanceKm.toFixed(1)} km - iminota nka ${route.durationMinutes} ukoresheje imodoka` : `${route.distanceKm.toFixed(1)} km - about ${route.durationMinutes} min by car`);
          setSteps(route.steps ?? []);
        } catch {
          setMessage(isRw ? "Amabwiriza y'inzira ntaboneka by'igihe gito." : "Directions are temporarily unavailable.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setMessage(isRw ? "Emerera kumenya aho uri kugira ngo ubone inzira." : "Allow location access to request directions.");
      },
    );
  }

  return (
    <div>
      <Button size="sm" variant="secondary" onClick={getDirections} disabled={loading}>
        <Navigation className="h-4 w-4" />
        {loading ? (isRw ? "Kwamamaza inzira..." : "Finding route...") : (isRw ? "Inzira" : "Directions")}
      </Button>
      {message ? <p className="mt-2 text-xs font-medium text-slate-500">{message}</p> : null}
      {steps.length > 0 ? (
        <ol className="mt-3 space-y-1 border-l-2 border-forest-100 pl-3 text-xs leading-5 text-slate-600">
          {steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}
        </ol>
      ) : null}
    </div>
  );
}
