interface PexelsPhoto {
  id: number;
  src: {
    large2x: string;
    original: string;
  };
  photographer: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

interface CachedImage {
  url: string;
  photographer: string;
  fetchedAt: number;
}

const CACHE_KEY_PREFIX = "pexels-v2-";
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const DEFAULT_QUERY = "nature landscape";

export function parsePexelsUrl(url: string): { isPexels: boolean; query: string } {
  const trimmed = url.trim().toLowerCase();
  if (trimmed === "pexels") {
    return { isPexels: true, query: DEFAULT_QUERY };
  }
  const prefix = "pexels:";
  if (trimmed.startsWith(prefix)) {
    return { isPexels: true, query: url.trim().slice(prefix.length) || DEFAULT_QUERY };
  }
  return { isPexels: false, query: "" };
}

function getCacheKey(theme: "light" | "dark", query: string): string {
  return `${CACHE_KEY_PREFIX}${theme}-${query}`;
}

function getCachedImage(theme: "light" | "dark", query: string): string | null {
  const raw = localStorage.getItem(getCacheKey(theme, query));
  if (!raw) return null;
  try {
    const cached: CachedImage = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(theme, query));
      return null;
    }
    return cached.url;
  } catch {
    return null;
  }
}

function setCachedImage(theme: "light" | "dark", query: string, url: string, photographer: string): void {
  const entry: CachedImage = { url, photographer, fetchedAt: Date.now() };
  localStorage.setItem(getCacheKey(theme, query), JSON.stringify(entry));
}

export async function fetchPexelsImage(
  apiKey: string,
  query: string,
  theme: "light" | "dark"
): Promise<string> {
  const cached = getCachedImage(theme, query);
  if (cached) return cached;

  const effectiveQuery = theme === "dark" ? `dark ${query}` : query;
  const params = new URLSearchParams({
    query: effectiveQuery,
    orientation: "landscape",
    per_page: "15",
    page: String(Math.floor(Math.random() * 3) + 1),
  });

  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`);
  }

  const data: PexelsSearchResponse = await res.json();
  if (!data.photos || data.photos.length === 0) {
    throw new Error("No photos found");
  }

  const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
  const imageUrl = photo.src.original;

  setCachedImage(theme, query, imageUrl, photo.photographer);
  return imageUrl;
}

export function clearPexelsCache(query: string): void {
  const theme = getCurrentTheme();
  localStorage.removeItem(getCacheKey(theme, query));
}

export function getCurrentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.body.classList.contains("dark-mode") ? "dark" : "light";
}
