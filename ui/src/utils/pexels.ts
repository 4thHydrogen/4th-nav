interface PexelsPhoto {
  id: number;
  src: {
    large2x: string;
    original: string;
  };
  photographer: string;
  photographer_url: string;
  url: string;
  avg_color: string;
  alt: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

export interface CachedPexelsImage {
  url: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
  avgColor: string;
  alt: string;
  fetchedAt: number;
}

const CACHE_KEY_PREFIX = "pexels-v3-";
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

function getThemeColor(theme: "light" | "dark"): string {
  return theme === "dark" ? "black" : "white";
}

function getThemeQuery(theme: "light" | "dark"): string {
  return theme === "dark" ? "abstract glass dark gradient" : "minimal bright glass gradient";
}

function getCacheKey(theme: "light" | "dark", query: string, color: string): string {
  return `${CACHE_KEY_PREFIX}${theme}:${query}:${color}:landscape:large`;
}

export function getCachedPexelsImage(theme: "light" | "dark", query: string): CachedPexelsImage | null {
  const color = getThemeColor(theme);
  const raw = localStorage.getItem(getCacheKey(theme, query, color));
  if (!raw) return null;
  try {
    const cached: CachedPexelsImage = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(theme, query, color));
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

function setCachedPexelsImage(theme: "light" | "dark", query: string, photo: PexelsPhoto): void {
  const color = getThemeColor(theme);
  const entry: CachedPexelsImage = {
    url: photo.src.large2x,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    photoUrl: photo.url,
    avgColor: photo.avg_color,
    alt: photo.alt || "",
    fetchedAt: Date.now(),
  };
  localStorage.setItem(getCacheKey(theme, query, color), JSON.stringify(entry));
}

export async function fetchPexelsImage(
  apiKey: string,
  query: string,
  theme: "light" | "dark"
): Promise<string> {
  const cached = getCachedPexelsImage(theme, query);
  if (cached) return cached.url;

  const color = getThemeColor(theme);
  const effectiveQuery = query || getThemeQuery(theme);
  const params = new URLSearchParams({
    query: effectiveQuery,
    orientation: "landscape",
    size: "large",
    color,
    per_page: "30",
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
  setCachedPexelsImage(theme, query, photo);
  return photo.src.large2x;
}

export function clearPexelsCache(query: string): void {
  const theme = getCurrentTheme();
  const color = getThemeColor(theme);
  localStorage.removeItem(getCacheKey(theme, query, color));
}

export function clearAllPexelsCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export function getCurrentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.body.classList.contains("dark-mode") ? "dark" : "light";
}
