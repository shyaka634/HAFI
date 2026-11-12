export type CloudinaryImagePreset = "header-banner" | "side-banner" | "discovery-card" | "discovery-admin" | "service-card" | "service-map";

const transformations: Record<CloudinaryImagePreset, string> = {
  // Top banners share a 16:5 card. Crop responsively around the focal area
  // so every current and future banner fills that card without blank space.
  "header-banner": "c_fill,g_auto,w_1280,h_400/f_auto/q_auto:good",
  "side-banner": "c_scale,w_960/f_auto/q_auto:good",
  // Keep the complete image within the card's bounds without enlarging small uploads.
  "discovery-card": "c_limit,w_720,h_450/f_auto/q_auto:good",
  "discovery-admin": "c_fill,g_auto,w_224,h_160/f_auto/q_auto:eco",
  "service-card": "c_fill,g_auto,w_720,h_352/f_auto/q_auto:good",
  "service-map": "c_fill,g_auto,w_416,h_224/f_auto/q_auto:eco",
};

/**
 * Creates a Cloudinary delivery URL sized for the place where it is shown.
 * Data URLs and media hosted elsewhere are deliberately returned unchanged.
 */
export function optimizedImageUrl(source: string, preset: CloudinaryImagePreset) {
  try {
    const url = new URL(source);
    if (url.hostname !== "res.cloudinary.com") return source;

    const marker = "/image/upload/";
    const position = url.pathname.indexOf(marker);
    if (position === -1) return source;

    url.pathname = `${url.pathname.slice(0, position + marker.length)}${transformations[preset]}/${url.pathname.slice(position + marker.length)}`;
    return url.toString();
  } catch {
    return source;
  }
}
