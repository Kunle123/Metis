"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  applyRootDevThemePreview,
  parseDevThemePreview,
  readStoredDevThemePreview,
  storeDevThemePreview,
  type DevThemePreview,
} from "@/components/dev/dev-theme-preview";

function readCurrentRootTheme(): DevThemePreview {
  const root = document.documentElement;
  return root.classList.contains("light") ? "light" : "dark";
}

export function ThemePreviewSwitch() {
  const pathname = usePathname();

  const enabled = process.env.NODE_ENV === "development";
  const isDevUi = Boolean(pathname?.startsWith("/dev/ui"));

  const [value, setValue] = useState<DevThemePreview>("dark");
  const [devUiQueryOverride, setDevUiQueryOverride] = useState<DevThemePreview | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;

    if (isDevUi) {
      const current = parseDevThemePreview(new URLSearchParams(window.location.search).get("theme"));
      setDevUiQueryOverride(current);
    } else {
      setDevUiQueryOverride(null);
    }

    // Apply precedence: stored -> current root.
    const stored = readStoredDevThemePreview();
    const next = stored ?? readCurrentRootTheme();
    applyRootDevThemePreview(next);
    setValue(next);
  }, [enabled, isDevUi]);

  if (!enabled) return null;

  const setPreview = (next: DevThemePreview) => {
    if (isDevUi && devUiQueryOverride) return;
    // Don't mutate URL here; `/dev/ui` has its own in-page buttons that manage the query param.
    storeDevThemePreview(next);
    applyRootDevThemePreview(next);
    setValue(next);
  };

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-[20rem] items-center justify-end"
      aria-hidden={false}
    >
      <div className="pointer-events-auto rounded-[1.1rem] border border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_72%,transparent)] px-3 py-2 shadow-[0_16px_44px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Dev theme</span>
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={value === "dark" ? "default" : "outline"}
              onClick={() => setPreview("dark")}
              disabled={Boolean(isDevUi && devUiQueryOverride)}
            >
              Dark
            </Button>
            <Button
              type="button"
              size="sm"
              variant={value === "light" ? "default" : "outline"}
              onClick={() => setPreview("light")}
              disabled={Boolean(isDevUi && devUiQueryOverride)}
            >
              Light
            </Button>
          </div>
        </div>
        {isDevUi ? (
          <p className="mt-1 text-[0.65rem] leading-snug text-[--metis-text-tertiary]">
            On <span className="font-mono text-[--metis-text-secondary]">/dev/ui</span>, <span className="font-mono">?theme=</span> wins.
            {devUiQueryOverride ? " Switch is locked while an override is present." : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

