/* eslint-disable @next/next/no-img-element -- Discovery media is administrator-provided. */

import { cn } from "@/lib/utils";

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
};

// A muted loop makes the advert lively without unexpectedly playing sound.
// "object-fill" makes every video fit the banner space without cropping it.
export function DiscoveryMedia({ source, alt, className, controls = false }: DiscoveryMediaProps) {
  if (isDiscoveryVideo(source)) {
    return <video aria-label={alt} autoPlay className={cn("object-fill", className)} controls={controls} loop muted playsInline preload="metadata" src={source} />;
  }

  return <img alt={alt} className={cn("object-cover", className)} src={source} />;
}
