export type CloudinaryImagePreset = "header-banner" | "side-banner" | "discovery-card" | "discovery-admin" | "service-card" | "service-map";

const transformations: Record<CloudinaryImagePreset, string> = {
  // Do not crop header or side banners. Their original aspect ratio is kept,
  // while the delivered image is limited to a sensible high-density width.
  "header-banner": "c_scale,w_960/f_auto/q_auto:good",
  "side-banner": "c_scale,w_960/f_auto/q_auto:good",
  "discovery-card": "c_fill,g_auto,w_720,h_450/f_auto/q_auto:good",
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
