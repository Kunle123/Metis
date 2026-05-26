"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Wraps `next-themes` with the Metis-specific configuration.
 *
 * - `attribute="class"` — applies `dark` / `light` to `<html>` to match the
 *   existing `.dark` / `.light` token blocks in `globals.css`.
 * - `defaultTheme="dark"` — preserves Metis' editorial dark identity.
 * - `storageKey` matches the key used by the former dev-only toggle so that
 *   any existing localStorage preference is picked up automatically.
 */
export function MetisThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="metis-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
