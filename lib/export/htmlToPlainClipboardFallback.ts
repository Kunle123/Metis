/**
 * Lightweight HTML → plain-text for Clipboard `text/plain` alongside rich `text/html`.
 * Not a general HTML parser — tuned for Metis export documents only.
 */

function decodeBasicEntities(text: string) {
  let s = text.replace(/&nbsp;/gi, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#(\d+);/g, (_, dec) => {
    const n = Number.parseInt(dec, 10);
    if (Number.isNaN(n)) return "";
    try {
      return String.fromCodePoint(n);
    } catch {
      return "";
    }
  });
  s = s.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    const n = Number.parseInt(hex, 16);
    if (Number.isNaN(n)) return "";
    try {
      return String.fromCodePoint(n);
    } catch {
      return "";
    }
  });
  s = s.replace(/&#39;/g, "'").replace(/&apos;/gi, "'");
  return s;
}

export function htmlExportToPlainClipboardFallback(html: string) {
  let s = html
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\/\s*script\s*>/gi, "")
    .replace(/<\s*style\b[^>]*>[\s\S]*?<\/\s*style\s*>/gi, "");
  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\s*h[1-6]\b[^>]*>/gi, "\n");
  s = s.replace(/<\/\s*(p|h[1-6]|div|section|header|article)\s*>/gi, "\n\n");
  s = s.replace(/<\s*li\b[^>]*>/gi, "\n• ");
  s = s.replace(/<\/\s*li\s*>/gi, "\n");
  s = s.replace(/<\/?ul\b[^>]*>/gi, "\n").replace(/<\/?ol\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeBasicEntities(s);
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
