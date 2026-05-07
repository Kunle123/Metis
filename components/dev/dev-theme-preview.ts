export type DevThemePreview = "dark" | "light";

export const DEV_THEME_PREVIEW_STORAGE_KEY = "metis-dev-theme-preview";

export function parseDevThemePreview(value: string | null | undefined): DevThemePreview | null {
  if (value === "dark") return "dark";
  if (value === "light") return "light";
  return null;
}

/** Apply mutually-exclusive root theme class. Never leaves both on `<html>`. */
export function applyRootDevThemePreview(next: DevThemePreview) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(next);
}

export function readStoredDevThemePreview(): DevThemePreview | null {
  try {
    return parseDevThemePreview(window.localStorage.getItem(DEV_THEME_PREVIEW_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeDevThemePreview(next: DevThemePreview) {
  try {
    window.localStorage.setItem(DEV_THEME_PREVIEW_STORAGE_KEY, next);
  } catch {
    // ignore (dev-only convenience)
  }
}

/**
 * Read query param override. Use for dev preview validation (and `/dev/ui?theme=light`).
 * Returns null when param is absent/invalid.
 */
export function readDevThemePreviewFromQuery(search: string): DevThemePreview | null {
  try {
    const value = new URLSearchParams(search).get("theme");
    return parseDevThemePreview(value);
  } catch {
    return null;
  }
}

/**
 * Dev-only first-paint initializer script.
 * Precedence: query param `?theme=` wins; otherwise localStorage wins; otherwise do nothing.
 */
export function devThemePreviewInitScript() {
  // Keep as a string factory so layout can inline it without importing client code.
  return `(function(){try{var q=new URLSearchParams(window.location.search).get('theme');var t=(q==='dark'||q==='light')?q:null;if(!t){try{t=localStorage.getItem('${DEV_THEME_PREVIEW_STORAGE_KEY}') }catch(e){t=null}}if(t==='dark'||t==='light'){var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t)}}catch(e){}})();`;
}

