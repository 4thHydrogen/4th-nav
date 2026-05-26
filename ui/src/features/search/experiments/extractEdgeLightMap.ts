const SAMPLE_COUNT = 48;
const EXPANSION_PX = 8;
const MAX_CANVAS_DIM = 256;
const FALLBACK_COLOR: [number, number, number] = [255, 255, 255];

export interface EdgeLightMapResult {
  border: string;
  outerGlow: string;
}

export function extractEdgeLightMap(
  img: HTMLImageElement,
  wrapperRect: DOMRect,
  accentColor?: [number, number, number]
): EdgeLightMapResult | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const naturalW = img.width || img.naturalWidth;
  const naturalH = img.height || img.naturalHeight;
  if (naturalW === 0 || naturalH === 0) return null;

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

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const samples: Sample[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const p = pointOnExpandedRect(
      i / SAMPLE_COUNT,
      wrapperRect.width,
      wrapperRect.height
    );
    const screenX = wrapperRect.left + p.x;
    const screenY = wrapperRect.top + p.y;
    const color = readImageColor(
      pixels,
      canvas.width,
      canvas.height,
      ((screenX - offsetX) / coverScale) * canvasScale,
      ((screenY - offsetY) / coverScale) * canvasScale
    );
    const [hue, saturation] = rgbToHsl(color.r, color.g, color.b);
    samples.push({
      r: color.r,
      g: color.g,
      b: color.b,
      hue,
      saturation,
      brightness: luminance(color),
    });
  }

  return buildResult(samples, accentColor);
}

export function fallbackGradients(
  color?: [number, number, number]
): EdgeLightMapResult {
  const [r, g, b] = color ?? FALLBACK_COLOR;
  const [hue, saturation] = rgbToHsl(r / 255, g / 255, b / 255);
  return buildResult([
    {
      r: r / 255,
      g: g / 255,
      b: b / 255,
      hue,
      saturation,
      brightness: luminance({ r: r / 255, g: g / 255, b: b / 255 }),
    },
  ]);
}

interface Sample {
  r: number;
  g: number;
  b: number;
  hue: number;
  saturation: number;
  brightness: number;
}

function buildResult(
  samples: Sample[],
  accentColor?: [number, number, number]
): EdgeLightMapResult {
  const avgColor = averageColor(samples, accentColor);
  const [hue, avgColorSaturation, avgColorLightness] = rgbToHsl(
    avgColor.r,
    avgColor.g,
    avgColor.b
  );
  const avgSaturation = Math.max(
    average(samples.map((s) => s.saturation)),
    avgColorSaturation
  );
  const avgBrightness = average(samples.map((s) => s.brightness));
  const saturation = clamp(avgSaturation * 100 * 1.12, 4, 58);
  const lightness = clamp(
    Math.max(avgColorLightness * 100, avgBrightness * 100) + 14,
    50,
    76
  );

  const colorStart = hslCss(hue - 3, saturation, lightness + 1, 0.84);
  const colorMid = hslCss(hue, saturation, lightness + 5, 0.92);
  const colorEnd = hslCss(hue + 3, saturation, lightness + 1, 0.84);
  const glowStart = hslCss(hue - 3, saturation, lightness, 0.2);
  const glowMid = hslCss(hue, saturation, lightness + 5, 0.26);
  const glowEnd = hslCss(hue + 3, saturation, lightness, 0.2);

  return {
    border: `linear-gradient(100deg, ${colorStart} 0%, ${colorMid} 48%, ${colorEnd} 100%)`,
    outerGlow: `linear-gradient(100deg, ${glowStart} 0%, ${glowMid} 48%, ${glowEnd} 100%)`,
  };
}

function averageColor(
  samples: Sample[],
  accentColor?: [number, number, number]
): { r: number; g: number; b: number } {
  if (samples.length > 0) {
    return {
      r: average(samples.map((s) => s.r)),
      g: average(samples.map((s) => s.g)),
      b: average(samples.map((s) => s.b)),
    };
  }

  const [r, g, b] = accentColor ?? FALLBACK_COLOR;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

function pointOnExpandedRect(
  t: number,
  width: number,
  height: number
): { x: number; y: number } {
  const w = width + EXPANSION_PX * 2;
  const h = height + EXPANSION_PX * 2;
  const d = t * (w * 2 + h * 2);

  if (d < w) return { x: d - EXPANSION_PX, y: -EXPANSION_PX };
  if (d < w + h) return { x: width + EXPANSION_PX, y: d - w - EXPANSION_PX };
  if (d < w * 2 + h) {
    return {
      x: width + EXPANSION_PX - (d - w - h),
      y: height + EXPANSION_PX,
    };
  }
  return { x: -EXPANSION_PX, y: height + EXPANSION_PX - (d - w * 2 - h) };
}

function readImageColor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number
): { r: number; g: number; b: number } {
  const cx = Math.round(clamp(x, 0, width - 1));
  const cy = Math.round(clamp(y, 0, height - 1));
  const idx = (cy * width + cx) * 4;
  return {
    r: pixels[idx] / 255,
    g: pixels[idx + 1] / 255,
    b: pixels[idx + 2] / 255,
  };
}

function averageHue(samples: Sample[]): number {
  let x = 0;
  let y = 0;
  samples.forEach((sample) => {
    const weight = 0.35 + sample.saturation + sample.brightness * 0.35;
    const angle = sample.hue * Math.PI / 180;
    x += Math.cos(angle) * weight;
    y += Math.sin(angle) * weight;
  });
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function luminance(color: { r: number; g: number; b: number }): number {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hslCss(
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number
): string {
  return `hsla(${Math.round((hue + 360) % 360)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%, ${alpha.toFixed(3)})`;
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
