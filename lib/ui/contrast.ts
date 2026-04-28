export type Rgba = { r: number; g: number; b: number; a: number };

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function clamp255(n: number) {
  return Math.min(255, Math.max(0, n));
}

function parseAlpha(raw: string | undefined) {
  if (!raw) return 1;
  const s = raw.trim();
  if (s.endsWith("%")) return clamp01(Number.parseFloat(s) / 100);
  return clamp01(Number.parseFloat(s));
}

function linToSrgb01(x: number) {
  x = Math.min(1, Math.max(0, x));
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
}

// Bradford adaptation D50 -> D65 (for CSS Lab -> sRGB).
function adaptD50ToD65(X: number, Y: number, Z: number) {
  // M_br * diag(M_br*white)^{-1} * diag(M_br*white2) * M_br^{-1}
  // Precomputed matrix from D50 to D65 Bradford adaptation.
  const x = 0.9555766 * X + -0.0230393 * Y + 0.0631636 * Z;
  const y = -0.0282895 * X + 1.0099416 * Y + 0.0210077 * Z;
  const z = 0.0122982 * X + -0.0204830 * Y + 1.3299098 * Z;
  return { X: x, Y: y, Z: z };
}

function labD50ToXyz(labL: number, labA: number, labB: number) {
  // D50 reference white
  const Xn = 0.96422;
  const Yn = 1.0;
  const Zn = 0.82521;

  const fy = (labL + 16) / 116;
  const fx = fy + labA / 500;
  const fz = fy - labB / 200;

  const delta = 6 / 29;
  const finv = (t: number) => (t > delta ? t ** 3 : 3 * delta ** 2 * (t - 4 / 29));

  const xr = finv(fx);
  const yr = finv(fy);
  const zr = finv(fz);

  return { X: xr * Xn, Y: yr * Yn, Z: zr * Zn };
}

function xyzD65ToLinearSrgb(X: number, Y: number, Z: number) {
  // sRGB D65 matrix
  const r = 3.2406 * X + -1.5372 * Y + -0.4986 * Z;
  const g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const b = 0.0557 * X + -0.2040 * Y + 1.0570 * Z;
  return { r, g, b };
}

export function parseCssColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase();

  // lab(L a b / alpha?)
  // CSS uses Lab with D50 reference white. L is typically a percentage, but may be number in some serializations.
  // Examples:
  // - lab(74.283% 1.98322 5.62841)
  // - lab(1.889% 0 0 / .08)
  const labMatch = s.match(
    /^lab\(\s*([0-9.]+%?)\s+([+-]?[0-9.]+)\s+([+-]?[0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)$/,
  );
  if (labMatch) {
    const Lraw = labMatch[1]!;
    const L = Lraw.endsWith("%") ? Number.parseFloat(Lraw) : Number.parseFloat(Lraw);
    const labL = Lraw.endsWith("%") ? L : L; // treat as 0-100
    const labA = Number.parseFloat(labMatch[2]!);
    const labB = Number.parseFloat(labMatch[3]!);
    const a = parseAlpha(labMatch[4]);

    const xyzD50 = labD50ToXyz(labL, labA, labB);
    const xyzD65 = adaptD50ToD65(xyzD50.X, xyzD50.Y, xyzD50.Z);
    const lin = xyzD65ToLinearSrgb(xyzD65.X, xyzD65.Y, xyzD65.Z);

    const r = clamp255(linToSrgb01(lin.r) * 255);
    const g = clamp255(linToSrgb01(lin.g) * 255);
    const b = clamp255(linToSrgb01(lin.b) * 255);
    return { r, g, b, a };
  }

  // oklch(L C H / a?)
  // Examples:
  // - oklch(0.95 0.015 78)
  // - oklch(1 0 0 / 9%)
  const oklchMatch = s.match(
    /^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*([0-9.]+%?))?\s*\)$/,
  );
  if (oklchMatch) {
    const L = Number.parseFloat(oklchMatch[1]!);
    const C = Number.parseFloat(oklchMatch[2]!);
    const Hdeg = Number.parseFloat(oklchMatch[3]!);
    const a = parseAlpha(oklchMatch[4]);

    const h = (Hdeg * Math.PI) / 180;
    const labA = C * Math.cos(h);
    const labB = C * Math.sin(h);

    // OKLab -> linear sRGB
    const l_ = L + 0.3963377774 * labA + 0.2158037573 * labB;
    const m_ = L - 0.1055613458 * labA - 0.0638541728 * labB;
    const s_ = L - 0.0894841775 * labA - 1.291485548 * labB;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const ss = s_ * s_ * s_;

    let rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * ss;
    let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * ss;
    let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * ss;

    const r = clamp255(linToSrgb01(rLin) * 255);
    const g = clamp255(linToSrgb01(gLin) * 255);
    const b = clamp255(linToSrgb01(bLin) * 255);
    return { r, g, b, a };
  }

  // oklab(L a b / a?)
  const oklabMatch = s.match(
    /^oklab\(\s*([0-9.]+)\s+([+-]?[0-9.]+)\s+([+-]?[0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)$/,
  );
  if (oklabMatch) {
    const L = Number.parseFloat(oklabMatch[1]!);
    const labA = Number.parseFloat(oklabMatch[2]!);
    const labB = Number.parseFloat(oklabMatch[3]!);
    const a = parseAlpha(oklabMatch[4]);

    const l_ = L + 0.3963377774 * labA + 0.2158037573 * labB;
    const m_ = L - 0.1055613458 * labA - 0.0638541728 * labB;
    const s_ = L - 0.0894841775 * labA - 1.291485548 * labB;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const ss = s_ * s_ * s_;

    let rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * ss;
    let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * ss;
    let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * ss;

    const r = clamp255(linToSrgb01(rLin) * 255);
    const g = clamp255(linToSrgb01(gLin) * 255);
    const b = clamp255(linToSrgb01(bLin) * 255);
    return { r, g, b, a };
  }

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

