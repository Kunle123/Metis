"use client";

import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Dev preview bar for `/dev/ui` — quick light / dark override for visual
 * token inspection.  Now delegates to `next-themes` instead of raw classList
 * manipulation, so the switch propagates through all `useTheme` consumers.
 */
export function DevUiRootTheme({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="not-prose mb-5 flex flex-col gap-3 rounded-[1.15rem] border border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_72%,transparent)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Dev preview · root theme class</p>
          <p className="text-sm leading-snug text-[--metis-text-secondary]">
            Switch theme for visual token inspection. Uses the same{" "}
            <code className="rounded bg-[color-mix(in_oklab,var(--metis-frame-soft)_82%,transparent)] px-1">next-themes</code>{" "}
            provider as the production appearance control.
          </p>
        </div>
        {mounted ? (
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
              Dark preview
            </Button>
            <Button type="button" variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
              Light preview
            </Button>
          </div>
        ) : null}
      </div>
      {children}
    </>
  );
}
