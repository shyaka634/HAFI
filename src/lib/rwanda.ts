export const RWANDA_PROVINCES = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  "Southern Province": ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
  "Eastern Province": ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  "Western Province": ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
} as const;

export const RWANDA_DISTRICTS = Object.values(RWANDA_PROVINCES).flat();
export const RWANDA_CENTER: [number, number] = [-1.9403, 29.8739];
export const RWANDA_BOUNDS: [[number, number], [number, number]] = [
  [-2.95, 28.8],
  [-1.0, 30.9],
];

export function provinceForDistrict(district: string) {
  return Object.entries(RWANDA_PROVINCES).find(([, districts]) =>
    (districts as readonly string[]).includes(district)
  )?.[0] ?? null;
}

export function isRwandaDistrict(district: string) {
  return (RWANDA_DISTRICTS as readonly string[]).includes(district);
}

export function isRwandaProvince(province: string) {
  return Object.prototype.hasOwnProperty.call(RWANDA_PROVINCES, province);
}

export function isWithinRwanda(latitude: number, longitude: number) {
  const [[south, west], [north, east]] = RWANDA_BOUNDS;
  return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
}

export function distanceInKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const radians = (value: number) => (value * Math.PI) / 180;
  const latDifference = radians(to.lat - from.lat);
  const lngDifference = radians(to.lng - from.lng);
  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lngDifference / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
