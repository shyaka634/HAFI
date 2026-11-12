import type { PublicDiscovery } from "@/lib/public-discovery";

export type HomeData = {
  categories: string[];
  discoveries: {
    top: PublicDiscovery[];
    topSecondary: PublicDiscovery[];
    side: PublicDiscovery[];
    sideHasMore: boolean;
  };
};

let cachedData: HomeData | null = null;
let loadingData: Promise<HomeData> | null = null;

export async function loadHomeData({ fresh = false }: { fresh?: boolean } = {}): Promise<HomeData> {
  if (!fresh && cachedData) return cachedData;
  if (!fresh && loadingData) return loadingData;

  // Version the URL so previously cached shorter banner lists are not reused.
  const request = fetch(`/api/home?content=side15${fresh ? `&refresh=${Date.now()}` : ""}`, fresh ? { cache: "no-store" } : undefined)
    .then(async (response) => {
      if (!response.ok) throw new Error("Home content is unavailable.");
      return response.json() as Promise<HomeData>;
    })
    .then((data) => {
      cachedData = data;
      return data;
    });

  if (!fresh) loadingData = request;
  try {
    return await request;
  } finally {
    if (!fresh) loadingData = null;
  }
}
