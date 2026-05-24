const SAMPLE_COUNT = 32;
const EXPANSION_PX = 20;
const GLOW_SATURATION = 0.65;
const GLOW_LIGHTNESS = 0.55;
const DEFAULT_MIN_ALPHA = 0.02;
const DEFAULT_MAX_ALPHA = 0.92;
const TOP_K = 5;
const DIM_ALPHA = 0.05;
const MAX_CANVAS_DIM = 200;
const MIN_BRIGHTNESS_RANGE = 0.02;
const FALLBACK_COLOR: [number, number, number] = [120, 210, 255];

export function extractEdgeLightMap(
  img: HTMLImageElement,
  wrapperRect: DOMRect,
  accentColor?: [number, number, number]
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallbackGradient(accentColor);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const naturalW = img.width || img.naturalWidth;
  const naturalH = img.height || img.naturalHeight;

  if (naturalW === 0 || naturalH === 0) return fallbackGradient(accentColor);

  const coverScale = Math.max(vw / naturalW, vh / naturalH);
  const renderedW = naturalW * coverScale;
  const renderedH = naturalH * coverScale;
  const offsetX = (vw - renderedW) / 2;
  const offsetY = (vh - renderedH) / 2;

  const canvasScale = Math.min(
    MAX_CANVAS_DIM / naturalW,
    MAX_CANVAS_DIM / naturalH,
    1
  );
  canvas.width = Math.round(naturalW * canvasScale);
  canvas.height = Math.round(naturalH * canvasScale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const centerX = wrapperRect.left + wrapperRect.width / 2;
  const centerY = wrapperRect.top + wrapperRect.height / 2;
  const hw = wrapperRect.width / 2 + EXPANSION_PX;
  const hh = wrapperRect.height / 2 + EXPANSION_PX;

  const samples: { hue: number; brightness: number }[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const angle = (i / SAMPLE_COUNT) * Math.PI * 2;
    const screenX = centerX + hw * Math.cos(angle);
    const screenY = centerY + hh * Math.sin(angle);

    const origX = (screenX - offsetX) / coverScale;
    const origY = (screenY - offsetY) / coverScale;

    const cx = Math.round(clamp(origX * canvasScale, 0, canvas.width - 1));
    const cy = Math.round(clamp(origY * canvasScale, 0, canvas.height - 1));

    const idx = (cy * canvas.width + cx) * 4;
    const r = pixels[idx] / 255;
    const g = pixels[idx + 1] / 255;
    const b = pixels[idx + 2] / 255;

    const [hue, _, l] = rgbToHsl(r, g, b);
    const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    samples.push({ hue, brightness });
  }

  const brightnesses = samples.map((s) => s.brightness);
  const minB = Math.min(...brightnesses);
  const maxB = Math.max(...brightnesses);
  const range = maxB - minB;

  if (range < MIN_BRIGHTNESS_RANGE) return fallbackGradient(accentColor);

  // Find threshold for top-K brightest points
  const normalized = samples.map((s) => (s.brightness - minB) / range);
  const sorted = [...normalized].sort((a, b) => b - a);
  const threshold = sorted[Math.min(TOP_K - 1, sorted.length - 1)];

  const stops: string[] = [];

  const computeAlpha = (n: number): number => {
    if (n >= threshold && threshold > 0) {
      // Top-K bright: map [threshold, 1] → [0.70, 0.92]
      const t = (n - threshold) / (1 - threshold || 1);
      return 0.70 + t * (DEFAULT_MAX_ALPHA - 0.70);
    }
    // Dim: map [0, threshold) → [0.02, 0.05]
    const t = threshold > 0 ? n / threshold : 0;
    return DEFAULT_MIN_ALPHA + t * (DIM_ALPHA - DEFAULT_MIN_ALPHA);
  };

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const { hue } = samples[i];
    const alpha = computeAlpha(normalized[i]);

    const [cr, cg, cb] = hslToRgb(hue, GLOW_SATURATION, GLOW_LIGHTNESS);
    const deg = (i / SAMPLE_COUNT) * 360;

    stops.push(
      `rgba(${Math.round(cr * 255)}, ${Math.round(cg * 255)}, ${Math.round(cb * 255)}, ${alpha.toFixed(3)}) ${deg.toFixed(1)}deg`
    );
  }

  // Close the loop
  const first = samples[0];
  const firstAlpha = computeAlpha(normalized[0]);
  const [fr, fg, fb] = hslToRgb(first.hue, GLOW_SATURATION, GLOW_LIGHTNESS);
  stops.push(
    `rgba(${Math.round(fr * 255)}, ${Math.round(fg * 255)}, ${Math.round(fb * 255)}, ${firstAlpha.toFixed(3)}) 360deg`
  );

  return `conic-gradient(from 90deg at 50% 50%, ${stops.join(", ")})`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function fallbackGradient(color?: [number, number, number]): string {
  const [r, g, b] = color ?? FALLBACK_COLOR;
  return `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.10), rgba(${r}, ${g}, ${b}, 0.18), rgba(${r}, ${g}, ${b}, 0.10))`;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  h /= 6;

  return [h * 360, s, l];
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): [number, number, number] {
  const hn = h / 360;

  if (s === 0) return [l, l, l];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return [
    hue2rgb(p, q, hn + 1 / 3),
    hue2rgb(p, q, hn),
    hue2rgb(p, q, hn - 1 / 3),
  ];
}
