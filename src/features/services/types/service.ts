import type { ServiceCategory } from "@/lib/types";

export type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  district: string;
  sector: string | null;
  address: string | null;
  phone: string | null;
  imageBase64: string | null;
  latitude: number;
  longitude: number;
  distanceKm?: number;
};

export type LocationPoint = {
  lat: number;
  lng: number;
};

// Leaflet uses latitude, longitude pairs when drawing a route line.
export type ServiceRoute = {
  serviceId: string;
  userLocation: LocationPoint;
  points: Array<[number, number]>;
};
