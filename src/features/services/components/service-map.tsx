"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { RWANDA_BOUNDS, RWANDA_CENTER } from "@/lib/rwanda";
import type { Service, ServiceRoute } from "@/features/services/types/service";
import { useLocale } from "@/providers/locale-provider";

const marker = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const userMarker = L.divIcon({ className: "", html: '<span style="display:block;width:16px;height:16px;border:3px solid white;border-radius:999px;background:#1570EF;box-shadow:0 0 0 2px #1570EF"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });

export function ServiceMap({ route, services, userLocation }: { route: ServiceRoute | null; services: Service[]; userLocation: { lat: number; lng: number } | null }) {
  const { locale } = useLocale();
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : RWANDA_CENTER;
  return <MapContainer center={center} zoom={userLocation ? 13 : 8} minZoom={7} maxBounds={RWANDA_BOUNDS} maxBoundsViscosity={1} className="h-full w-full"><TileLayer attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarker}><Popup>{locale === "rw" ? "Aho uri" : "Your location"}</Popup></Marker>}{route ? <><Polyline pathOptions={{ color: "#1570ef", opacity: 0.9, weight: 6 }} positions={route.points} /><RouteViewport points={route.points} /></> : null}{services.map((service) => <Marker key={service.id} icon={marker} position={[service.latitude, service.longitude]}><Tooltip direction="top" offset={[0, -28]}><div className="w-44">{service.imageBase64 ? <img alt={`Photo of ${service.name}`} className="mb-2 h-24 w-full rounded object-cover" src={service.imageBase64} /> : null}<strong>{service.name}</strong></div></Tooltip><Popup><div className="w-52">{service.imageBase64 ? <img alt={`Photo of ${service.name}`} className="mb-2 h-28 w-full rounded object-cover" src={service.imageBase64} /> : null}<strong>{service.name}</strong><br />{service.address || service.district}</div></Popup></Marker>)}</MapContainer>;
}

function RouteViewport({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 15 });
  }, [map, points]);

  return null;
}
