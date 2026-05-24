interface DomainIconPreset {
  keywords: string[];
  icon: string;
  name: string;
}

let presets: DomainIconPreset[] = [];

export async function initPresets(): Promise<void> {
  try {
    const resp = await fetch('/static/icons/presets.json');
    if (!resp.ok) return;
    presets = await resp.json();
  } catch {
    // 加载失败时保持空数组，matchIconByDomain 返回 null
  }
}

export function matchIconByDomain(url: string): string | null {
  if (presets.length === 0) return null;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const sorted = [...presets].sort((a, b) => {
      const aMax = Math.max(...a.keywords.map(k => k.length));
      const bMax = Math.max(...b.keywords.map(k => k.length));
      return bMax - aMax;
    });
    for (const preset of sorted) {
      if (preset.keywords.some(kw => hostname === kw || hostname.endsWith("." + kw))) {
        return preset.icon;
      }
    }
  } catch {
    // invalid URL
  }
  return null;
}
