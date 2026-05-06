"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type Preview = "dark" | "light";

function readThemeParam(value: string | null): Preview {
  return value === "light" ? "light" : "dark";
}

/** Apply mutually-exclusive root theme class (immediate, for optimistic clicks + URL hydration). */
function applyRootPreview(next: Preview) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(next);
}

function DevUiRootThemeInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preview = readThemeParam(searchParams.get("theme"));

  useLayoutEffect(() => {
    if (!pathname?.startsWith("/dev/ui")) return;
    const fromWindow = new URLSearchParams(window.location.search).get("theme");
    applyRootPreview(readThemeParam(fromWindow ?? searchParams.get("theme")));
  }, [pathname, searchParams]);

  useEffect(() => {
    return () => {
      const root = document.documentElement;
      root.classList.remove("light");
      if (!root.classList.contains("dark")) root.classList.add("dark");
    };
  }, []);

  const syncUrl = useCallback(
    (next: Preview) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "light") nextParams.set("theme", "light");
      else nextParams.delete("theme");
      const qs = nextParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setPreviewTracked = useCallback(
    (next: Preview) => {
      if (!pathname?.startsWith("/dev/ui")) return;
      applyRootPreview(next);
      syncUrl(next);
    },
    [pathname, syncUrl],
  );

  if (!pathname?.startsWith("/dev/ui")) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="not-prose mb-5 flex flex-col gap-3 rounded-[1.15rem] border border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_72%,transparent)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Dev preview · root theme class</p>
          <p className="text-sm leading-snug text-[--metis-text-secondary]">
            Nested <code className="rounded bg-[color-mix(in_oklab,var(--metis-frame-soft)_82%,transparent)] px-1">.light</code> wrappers are invalid when{" "}
            <code className="rounded px-1">{'<html>'}</code> stays <code className="rounded px-1">dark</code> — the document body and Metis shell never resolve
            light tokens, so chips/inputs look washed out. This control sets <code className="rounded px-1">dark</code> or <code className="rounded px-1">light</code>{" "}
            on <code className="rounded px-1">{'<html>'}</code> (exactly one); leaving the route restores <code className="rounded px-1">dark</code>.
          </p>
          <p className="text-xs text-[--metis-text-tertiary]">
            Bookmark <span className="font-mono text-[--metis-text-secondary]">/dev/ui?theme=light</span>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant={preview === "dark" ? "default" : "outline"} size="sm" onClick={() => setPreviewTracked("dark")}>
            Dark preview
          </Button>
          <Button type="button" variant={preview === "light" ? "default" : "outline"} size="sm" onClick={() => setPreviewTracked("light")}>
            Light preview
          </Button>
        </div>
      </div>
      {children}
    </>
  );
}

/** `/dev/ui`: toggles `document.documentElement` between `dark` and `light`; restores `dark` on unmount. Wrapped in `Suspense` for `useSearchParams`. */
export function DevUiRootTheme({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <DevUiRootThemeInner>{children}</DevUiRootThemeInner>
    </Suspense>
  );
}
