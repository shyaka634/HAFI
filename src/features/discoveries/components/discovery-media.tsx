/* eslint-disable @next/next/no-img-element -- Discovery media is administrator-provided. */

import { cn } from "@/lib/utils";
import { optimizedImageUrl, type CloudinaryImagePreset } from "@/lib/media-url";

export function isDiscoveryVideo(source: string) {
  if (source.startsWith("data:video/")) return true;

  try {
    const url = new URL(source);
    return /\.(mp4|webm|ogv|ogg)$/i.test(url.pathname) || url.pathname.includes("/video/upload/");
  } catch {
    return false;
  }
}

type DiscoveryMediaProps = {
  source: string;
  alt: string;
  className?: string;
  controls?: boolean;
  imagePreset?: CloudinaryImagePreset;
  loading?: "eager" | "lazy";
  fit?: "contain" | "cover" | "fill";
};

// A muted loop makes the advert lively without unexpectedly playing sound.
// Discovery cards can use `contain` to preserve the complete media, while
// compact banner placements can keep their intentional edge-to-edge layout.
export function DiscoveryMedia({ source, alt, className, controls = false, imagePreset = "discovery-card", loading = "lazy", fit = "fill" }: DiscoveryMediaProps) {
  const fitClass = fit === "contain" ? "object-contain" : fit === "cover" ? "object-cover" : "object-fill";

  if (isDiscoveryVideo(source)) {
    return <video aria-label={alt} autoPlay className={cn(fitClass, className)} controls={controls} loop muted playsInline preload="metadata" src={source} />;
  }

  return <img alt={alt} className={cn(fitClass, className)} decoding="async" loading={loading} src={optimizedImageUrl(source, imagePreset)} />;
}
