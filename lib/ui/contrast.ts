export type Rgba = { r: number; g: number; b: number; a: number };

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function clamp255(n: number) {
  return Math.min(255, Math.max(0, n));
}

export function parseCssColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase();

  // color(srgb r g b / a)
  // Example: color(srgb 0.12 0.34 0.56 / 0.9)
  const srgbMatch = s.match(/^color\(\s*srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)$/);
  if (srgbMatch) {
    const r = clamp255(Number.parseFloat(srgbMatch[1]!) * 255);
    const g = clamp255(Number.parseFloat(srgbMatch[2]!) * 255);
    const b = clamp255(Number.parseFloat(srgbMatch[3]!) * 255);
    const a = srgbMatch[4] == null ? 1 : clamp01(Number.parseFloat(srgbMatch[4]!));
    return { r, g, b, a };
  }

  // #rgb, #rgba, #rrggbb, #rrggbbaa
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (![3, 4, 6, 8].includes(hex.length)) return null;
    const expand = (c: string) => c + c;

    const read = (h: string) => Number.parseInt(h, 16);
    if (hex.length === 3 || hex.length === 4) {
      const r = read(expand(hex[0]!));
      const g = read(expand(hex[1]!));
      const b = read(expand(hex[2]!));
      const a = hex.length === 4 ? read(expand(hex[3]!)) / 255 : 1;
      return { r, g, b, a: clamp01(a) };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = read(hex.slice(0, 2));
      const g = read(hex.slice(2, 4));
      const b = read(hex.slice(4, 6));
      const a = hex.length === 8 ? read(hex.slice(6, 8)) / 255 : 1;
      return { r, g, b, a: clamp01(a) };
    }
  }

  // rgb()/rgba() - comma-separated or space-separated with optional "/ alpha"
  // Examples:
  // - rgb(255, 255, 255)
  // - rgba(255, 255, 255, 0.5)
  // - rgb(255 255 255 / 0.5)
  // - rgb(100% 0% 0% / 50%)
  const fnMatch = s.match(/^rgba?\(\s*([^\)]+)\s*\)$/);
  if (fnMatch) {
    const body = fnMatch[1]!;
    const slashSplit = body.split("/");
    const channelsRaw = slashSplit[0]!.trim();
    const alphaRaw = slashSplit[1]?.trim();

    const channels = channelsRaw.includes(",")
      ? channelsRaw.split(",").map((p) => p.trim()).filter(Boolean)
      : channelsRaw.split(/\s+/).map((p) => p.trim()).filter(Boolean);
    if (channels.length < 3) return null;

    const toChannel = (raw: string) => {
      if (raw.endsWith("%")) return clamp255((Number.parseFloat(raw) / 100) * 255);
      return clamp255(Number.parseFloat(raw));
    };
    const toAlpha = (raw: string) => {
      if (raw.endsWith("%")) return clamp01(Number.parseFloat(raw) / 100);
      return clamp01(Number.parseFloat(raw));
    };

    const r = toChannel(channels[0]!);
    const g = toChannel(channels[1]!);
    const b = toChannel(channels[2]!);

    // If comma-separated rgba(..., a) style alpha exists as 4th channel, honor it.
    const alphaFrom4th = channels[3];
    const a =
      alphaRaw != null ? toAlpha(alphaRaw) : alphaFrom4th != null ? toAlpha(alphaFrom4th) : 1;

    return { r, g, b, a };
  }

  // Support "transparent"
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  return null;
}

export function rgbaToCss({ r, g, b, a }: Rgba) {
  const rr = Math.round(clamp255(r));
  const gg = Math.round(clamp255(g));
  const bb = Math.round(clamp255(b));
  const aa = clamp01(a);
  return `rgba(${rr}, ${gg}, ${bb}, ${aa.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")})`;
}

export function rgbaToHex({ r, g, b }: Rgba) {
  const toHex = (n: number) => Math.round(clamp255(n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function compositeOver(fg: Rgba, bg: Rgba): Rgba {
  const a = clamp01(fg.a + bg.a * (1 - fg.a));
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
  const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
  const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
  return { r, g, b, a };
}

function srgbToLinear(channel255: number) {
  const c = clamp255(channel255) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: Rgba) {
  // Alpha should be handled before calling this (composite to opaque).
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fgOpaque: Rgba, bgOpaque: Rgba) {
  const L1 = relativeLuminance(fgOpaque);
  const L2 = relativeLuminance(bgOpaque);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function wcagLabel(ratio: number) {
  return {
    aaNormalText: ratio >= 4.5,
    aaLargeTextOrUi: ratio >= 3,
    aaaText: ratio >= 7,
  };
}

