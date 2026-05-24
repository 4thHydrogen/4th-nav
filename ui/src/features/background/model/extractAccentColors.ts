export interface AccentColors {
  glow1: [number, number, number];
  glow2: [number, number, number];
  glow3: [number, number, number];
}

const DEFAULT_COLORS: AccentColors = {
  glow1: [88, 176, 255],
  glow2: [96, 128, 255],
  glow3: [128, 222, 255],
};

const MAX_DIM = 64;
const MIN_SATURATION = 0.15;
const MIN_LIGHTNESS = 0.1;
const MAX_LIGHTNESS = 0.9;
const HUE_BUCKETS = 36;
const HUE_BUCKET_SIZE = 360 / HUE_BUCKETS;
const MIN_HUE_DISTANCE = 30;

export function extractAccentColors(imageUrl: string): Promise<AccentColors> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const colors = sampleDominantColors(img);
        resolve(colors);
      } catch {
        resolve(DEFAULT_COLORS);
      }
    };

    img.onerror = () => resolve(DEFAULT_COLORS);
    img.src = imageUrl;
  });
}

function sampleDominantColors(img: HTMLImageElement): AccentColors {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return DEFAULT_COLORS;

  const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  type Bucket = { r: number; g: number; b: number; count: number };
  const buckets: Bucket[] = Array.from({ length: HUE_BUCKETS }, () => ({
    r: 0,
    g: 0,
    b: 0,
    count: 0,
  }));

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;

    const [h, s, l] = rgbToHsl(r, g, b);

    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) {
      continue;
    }

    const bucketIdx = Math.floor(h / HUE_BUCKET_SIZE) % HUE_BUCKETS;
    buckets[bucketIdx].r += pixels[i];
    buckets[bucketIdx].g += pixels[i + 1];
    buckets[bucketIdx].b += pixels[i + 2];
    buckets[bucketIdx].count++;
  }

  const sorted = buckets
    .map((b, i) => ({ ...b, hue: i * HUE_BUCKET_SIZE }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);

  const selected: { r: number; g: number; b: number }[] = [];

  for (const bucket of sorted) {
    if (selected.length >= 3) break;

    const avgR = Math.round(bucket.r / bucket.count);
    const avgG = Math.round(bucket.g / bucket.count);
    const avgB = Math.round(bucket.b / bucket.count);

    const tooClose = selected.some((s) => {
      const [sh] = rgbToHsl(s.r / 255, s.g / 255, s.b / 255);
      return hueDistance(sh, bucket.hue) < MIN_HUE_DISTANCE;
    });

    if (!tooClose) {
      selected.push({ r: avgR, g: avgG, b: avgB });
    }
  }

  if (selected.length < 3) return DEFAULT_COLORS;

  return {
    glow1: [selected[0].r, selected[0].g, selected[0].b],
    glow2: [selected[1].r, selected[1].g, selected[1].b],
    glow3: [selected[2].r, selected[2].g, selected[2].b],
  };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return [h * 360, s, l];
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}
