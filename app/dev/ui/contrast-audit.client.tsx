"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  compositeOver,
  contrastRatio,
  parseCssColor,
  rgbaToCss,
  rgbaToHex,
  wcagLabel,
  type Rgba,
} from "@/lib/ui/contrast";

type Pair = {
  id: string;
  fg: string;
  bg: string;
  kind: "text" | "ui" | "layer";
  note: string;
};

type Resolved = {
  token: string;
  rawVar: string;
  rawComputed: string;
  normalizedComputed: string | null;
  rgba: Rgba | null;
  strategy: string;
};

type AuditExportRow = {
  id: string;
  kind: Pair["kind"];
  fgToken: string;
  bgToken: string;
  resolves: boolean;
  fg: {
    rawVar: string;
    rawComputed: string;
    normalizedComputed: string | null;
    parsedHex: string | null;
    strategy: string;
  };
  bg: {
    rawVar: string;
    rawComputed: string;
    normalizedComputed: string | null;
    parsedHex: string | null;
    strategy: string;
  };
  ratio: number | null;
  labels:
    | null
    | {
        aaNormalText: boolean;
        aaLargeTextOrUi: boolean;
        aaaText: boolean;
      };
  separationLabel: string | null;
 };

function separationNote(ratio: number) {
  if (ratio < 1.15) return "Weak (near-indistinguishable)";
  if (ratio < 1.35) return "Subtle";
  if (ratio < 1.75) return "Clear";
  return "Strong";
}

function normalizeCssColorViaCanvas(css: string) {
  // Normalizes supported CSS Color 4 formats (oklch(), color-mix(), etc) to an rgb/rgba string in most browsers.
  // If the browser can't parse it, returns null.
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const sentinel = "rgba(0, 0, 0, 0)";
  ctx.fillStyle = sentinel;
  ctx.fillStyle = css;
  const normalized = ctx.fillStyle as unknown as string;
  if (!normalized || normalized === sentinel) {
    // If the intended color is exactly transparent, allow it.
    return css.trim().toLowerCase() === "transparent" ? "rgba(0, 0, 0, 0)" : null;
  }
  return normalized;
}

function parseComputedColor(css: string) {
  // First attempt direct parsing (handles rgb/rgba/hex/color(srgb...)).
  const direct = parseCssColor(css);
  if (direct) return { rgba: direct, normalized: null };
  // Fallback: try canvas normalization for oklch()/color-mix()/etc.
  const normalized = normalizeCssColorViaCanvas(css);
  if (!normalized) return { rgba: null, normalized: null };
  return { rgba: parseCssColor(normalized), normalized };
}

function readRootVar(token: string) {
  // Expects token like "--background"
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function computedFromProbe(appliedCss: string, property: "color" | "backgroundColor" | "borderColor") {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  el.style.top = "-9999px";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.border = "1px solid transparent";
  el.style.backgroundColor = "transparent";
  el.style.color = "transparent";

  if (property === "borderColor") el.style.borderTopColor = appliedCss;
  if (property === "backgroundColor") el.style.backgroundColor = appliedCss;
  if (property === "color") el.style.color = appliedCss;

  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const rawComputed =
    property === "borderColor" ? cs.borderTopColor : property === "backgroundColor" ? cs.backgroundColor : cs.color;
  document.body.removeChild(el);
  return rawComputed;
}

function resolveTokenColor(token: string, property: "color" | "backgroundColor" | "borderColor"): Resolved {
  const rawVar = readRootVar(token);

  const candidates: Array<{ strategy: string; appliedCss: string }> = [{ strategy: `${property}: var(${token})`, appliedCss: `var(${token})` }];

  // If this var looks like a full color value (starts with a color function or #),
  // prefer applying it directly as a full color (not wrapped in hsl/oklch).
  const looksLikeFullColor = /^#|^rgb\(|^rgba\(|^hsl\(|^hsla\(|^oklch\(|^oklab\(|^color\(|^lab\(|^lch\(/i.test(rawVar);
  const tried: typeof candidates = looksLikeFullColor
    ? [{ strategy: `${property}: var(${token}) (full-color)`, appliedCss: `var(${token})` }]
    : [
        ...candidates,
        { strategy: `${property}: hsl(var(${token}))`, appliedCss: `hsl(var(${token}))` },
        { strategy: `${property}: oklch(var(${token}))`, appliedCss: `oklch(var(${token}))` },
      ];

  const rawVarIsTransparent = rawVar === "transparent" || rawVar === "";
  const allowTransparentToken = token === "--border"; // Some border tokens may be low-alpha; treat true transparent as failure unless explicitly transparent.

  for (const c of tried) {
    const rawComputed = computedFromProbe(c.appliedCss, property);
    const parsed = parseComputedColor(rawComputed);

    const isTransparentBlack =
      parsed.rgba && parsed.rgba.a === 0 && parsed.rgba.r === 0 && parsed.rgba.g === 0 && parsed.rgba.b === 0;
    // If a non-transparent var yields transparent black, treat it as an invalid strategy (often from invalid hsl/oklch wrapper).
    if (isTransparentBlack && !rawVarIsTransparent && !allowTransparentToken) {
      continue;
    }

    if (parsed.rgba) {
      return {
        token,
        rawVar,
        rawComputed,
        normalizedComputed: parsed.normalized,
        rgba: parsed.rgba,
        strategy: c.strategy,
      };
    }
  }

  // Capture last computed for debugging.
  const rawComputed = computedFromProbe(`var(${token})`, property);
  const parsed = parseComputedColor(rawComputed);
  return {
    token,
    rawVar,
    rawComputed,
    normalizedComputed: parsed.normalized,
    rgba: parsed.rgba,
    strategy: "parse failed (all strategies)",
  };
}

function tokenPropertyForKind(kind: Pair["kind"], which: "fg" | "bg"): "color" | "backgroundColor" | "borderColor" {
  if (kind === "text") return which === "fg" ? "color" : "backgroundColor";
  if (kind === "ui") return which === "fg" ? "borderColor" : "backgroundColor";
  // layer
  return "backgroundColor";
}

function PassPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      className={
        ok
          ? "border-0 bg-[--metis-status-success-bg] text-[--metis-status-success-fg]"
          : "border-0 bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]"
      }
    >
      {label}: {ok ? "PASS" : "FAIL"}
    </Badge>
  );
}

function ColorChip({ rgba }: { rgba: Rgba }) {
  return (
    <span className="inline-block h-5 w-8 rounded-md border border-[--metis-outline-strong]" style={{ background: rgbaToCss(rgba) }} />
  );
}

export function ContrastAudit() {
  const pairs: Pair[] = useMemo(
    () => [
      // Text contrast
      { id: "text-paper-on-bg", kind: "text", fg: "--metis-paper", bg: "--background", note: "Primary body text on page background." },
      { id: "text-muted-on-bg", kind: "text", fg: "--metis-paper-muted", bg: "--background", note: "Secondary text on page background." },
      { id: "text-inksoft-on-bg", kind: "text", fg: "--metis-ink-soft", bg: "--background", note: "UI eyebrow labels on page background." },
      { id: "text-paper-on-info", kind: "text", fg: "--metis-paper", bg: "--metis-info-bg", note: "Text inside info panels / rails." },
      { id: "text-muted-on-info", kind: "text", fg: "--metis-paper-muted", bg: "--metis-info-bg", note: "Muted text inside info panels." },

      // UI boundary contrast
      { id: "ui-border-on-bg", kind: "ui", fg: "--border", bg: "--background", note: "Global border token against page background." },
      { id: "ui-control-border-on-control", kind: "ui", fg: "--metis-control-border", bg: "--metis-control-bg", note: "Control border against control fill." },
      { id: "ui-info-border-on-info", kind: "ui", fg: "--metis-info-border", bg: "--metis-info-bg", note: "Info border against info fill." },

      // Layer separation (heuristic; NOT WCAG)
      { id: "layer-card-vs-bg", kind: "layer", fg: "--card", bg: "--background", note: "Card layer vs page frame." },
      { id: "layer-control-vs-card", kind: "layer", fg: "--metis-control-bg", bg: "--card", note: "Controls should pop from cards." },
      { id: "layer-info-vs-card", kind: "layer", fg: "--metis-info-bg", bg: "--card", note: "Info panels should read distinct from neutral cards." },
    ],
    [],
  );

  const [rows, setRows] = useState<
    Array<{
      pair: Pair;
      fg: Resolved;
      bg: Resolved;
      ratio: number | null;
      labels: ReturnType<typeof wcagLabel> | null;
      separation: string | null;
    }>
  >([]);

  const exportRows: AuditExportRow[] = useMemo(() => {
    return rows.map((r) => ({
      id: r.pair.id,
      kind: r.pair.kind,
      fgToken: r.pair.fg,
      bgToken: r.pair.bg,
      resolves: Boolean(r.fg.rgba && r.bg.rgba && r.ratio != null),
      fg: {
        rawVar: r.fg.rawVar,
        rawComputed: r.fg.rawComputed,
        normalizedComputed: r.fg.normalizedComputed,
        parsedHex: r.fg.rgba ? rgbaToHex(r.fg.rgba) : null,
        strategy: r.fg.strategy,
      },
      bg: {
        rawVar: r.bg.rawVar,
        rawComputed: r.bg.rawComputed,
        normalizedComputed: r.bg.normalizedComputed,
        parsedHex: r.bg.rgba ? rgbaToHex(r.bg.rgba) : null,
        strategy: r.bg.strategy,
      },
      ratio: r.ratio,
      labels: r.labels,
      separationLabel: r.separation,
    }));
  }, [rows]);

  const keyPairIds = useMemo(
    () =>
      [
        "ui-border-on-bg",
        "ui-control-border-on-control",
        "ui-info-border-on-info",
        "layer-card-vs-bg",
        "layer-control-vs-card",
        "layer-info-vs-card",
        "text-paper-on-bg",
        "text-muted-on-bg",
        "text-paper-on-info",
      ] as const,
    [],
  );

  const keyPairs = useMemo(() => exportRows.filter((r) => keyPairIds.includes(r.id as any)), [exportRows, keyPairIds]);
  const keyPairsJson = useMemo(() => JSON.stringify(keyPairs, null, 2), [keyPairs]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    const under = resolveTokenColor("--background", "backgroundColor");
    const underOpaque: Rgba = under.rgba ? { ...under.rgba, a: 1 } : { r: 10, g: 14, b: 15, a: 1 };

    const computed = pairs.map((pair) => {
      const fg = resolveTokenColor(pair.fg, tokenPropertyForKind(pair.kind, "fg"));
      const bg = resolveTokenColor(pair.bg, tokenPropertyForKind(pair.kind, "bg"));
      if (!fg.rgba || !bg.rgba) {
        return { pair, fg, bg, ratio: null, labels: null, separation: null };
      }

      // Make background opaque by compositing over page background if needed.
      const bgOpaque = bg.rgba.a < 1 ? compositeOver(bg.rgba, underOpaque) : { ...bg.rgba, a: 1 };
      // Make foreground opaque by compositing over bg (typical for borders/text that may have alpha).
      const fgOpaque = fg.rgba.a < 1 ? compositeOver(fg.rgba, bgOpaque) : { ...fg.rgba, a: 1 };

      const ratio = contrastRatio(fgOpaque, bgOpaque);
      const labels = wcagLabel(ratio);
      const separation = pair.kind === "layer" ? separationNote(ratio) : null;
      return { pair, fg: { ...fg, rgba: fgOpaque }, bg: { ...bg, rgba: bgOpaque }, ratio, labels, separation };
    });

    setRows(computed);
  }, [pairs]);

  const grouped = useMemo(() => {
    return {
      text: rows.filter((r) => r.pair.kind === "text"),
      ui: rows.filter((r) => r.pair.kind === "ui"),
      layer: rows.filter((r) => r.pair.kind === "layer"),
    };
  }, [rows]);

  function Table({ title, items, showWcag }: { title: string; items: typeof rows; showWcag: boolean }) {
    return (
      <div className="space-y-3 rounded-[1.2rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_36%,var(--metis-surface-page))] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">{title}</p>
            {title === "Layer separation (heuristic)" ? (
              <p className="mt-2 text-sm leading-6 text-[--metis-text-secondary]">
                This is an internal heuristic for visual hierarchy, not a WCAG requirement.
              </p>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs text-[--metis-text-secondary]">
                <th className="sticky left-0 z-10 bg-[--metis-surface-card] p-2 shadow-[1px_0_0_var(--metis-outline-subtle)]">Pair</th>
                <th className="p-2">FG token</th>
                <th className="p-2">BG token</th>
                <th className="p-2">FG debug</th>
                <th className="p-2">BG debug</th>
                <th className="p-2">Ratio</th>
                {showWcag ? <th className="p-2">WCAG</th> : <th className="p-2">Separation</th>}
                <th className="p-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.pair.id} className="border-t border-[--metis-outline-subtle]">
                  <td className="sticky left-0 z-10 bg-[--metis-surface-card] p-2 align-top shadow-[1px_0_0_var(--metis-outline-subtle)]">
                    <code className="text-xs text-[--metis-text-primary]">{r.pair.id}</code>
                  </td>
                  <td className="p-2 align-top">
                    <code className="text-xs text-[--metis-text-primary]">{r.pair.fg}</code>
                  </td>
                  <td className="p-2 align-top">
                    <code className="text-xs text-[--metis-text-primary]">{r.pair.bg}</code>
                  </td>
                  <td className="p-2 align-top">
                    <div className="space-y-2">
                      <div className="text-xs text-[--metis-text-secondary]">
                        <div className="text-[--metis-text-primary]">
                          {r.fg.rgba ? (
                            <span className="inline-flex items-center gap-2">
                              <ColorChip rgba={r.fg.rgba} />
                              <span>{rgbaToHex(r.fg.rgba)}</span>
                            </span>
                          ) : (
                            <Badge className="border-0 bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]">parse failed</Badge>
                          )}
                        </div>
                        <div>
                          <span className="text-[--metis-text-tertiary]">strategy</span> · <span>{r.fg.strategy}</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-[--metis-outline-subtle] bg-[--metis-frame-soft] p-2 text-[0.7rem] leading-5 text-[--metis-text-secondary]">
                        <div>
                          <span className="text-[--metis-text-tertiary]">var</span> · <code className="text-[--metis-text-primary]">{r.fg.rawVar || "∅"}</code>
                        </div>
                        <div className="mt-1">
                          <span className="text-[--metis-text-tertiary]">computed</span> ·{" "}
                          <code className="text-[--metis-text-primary]">{r.fg.rawComputed || "∅"}</code>
                        </div>
                        {r.fg.normalizedComputed ? (
                          <div className="mt-1">
                            <span className="text-[--metis-text-tertiary]">normalized</span> ·{" "}
                            <code className="text-[--metis-text-primary]">{r.fg.normalizedComputed}</code>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 align-top">
                    <div className="space-y-2">
                      <div className="text-xs text-[--metis-text-secondary]">
                        <div className="text-[--metis-text-primary]">
                          {r.bg.rgba ? (
                            <span className="inline-flex items-center gap-2">
                              <ColorChip rgba={r.bg.rgba} />
                              <span>{rgbaToHex(r.bg.rgba)}</span>
                            </span>
                          ) : (
                            <Badge className="border-0 bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]">parse failed</Badge>
                          )}
                        </div>
                        <div>
                          <span className="text-[--metis-text-tertiary]">strategy</span> · <span>{r.bg.strategy}</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-[--metis-outline-subtle] bg-[--metis-frame-soft] p-2 text-[0.7rem] leading-5 text-[--metis-text-secondary]">
                        <div>
                          <span className="text-[--metis-text-tertiary]">var</span> · <code className="text-[--metis-text-primary]">{r.bg.rawVar || "∅"}</code>
                        </div>
                        <div className="mt-1">
                          <span className="text-[--metis-text-tertiary]">computed</span> ·{" "}
                          <code className="text-[--metis-text-primary]">{r.bg.rawComputed || "∅"}</code>
                        </div>
                        {r.bg.normalizedComputed ? (
                          <div className="mt-1">
                            <span className="text-[--metis-text-tertiary]">normalized</span> ·{" "}
                            <code className="text-[--metis-text-primary]">{r.bg.normalizedComputed}</code>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 align-top">
                    {r.ratio != null ? (
                      <span className="font-medium text-[--metis-text-primary]">{r.ratio.toFixed(2)}:1</span>
                    ) : (
                      <span className="text-[--metis-text-secondary]">—</span>
                    )}
                  </td>
                  <td className="p-2 align-top">
                    {showWcag ? (
                      r.labels && r.ratio != null ? (
                        <div className="flex flex-wrap gap-2">
                          <PassPill ok={r.labels.aaNormalText} label="AA 4.5" />
                          <PassPill ok={r.labels.aaLargeTextOrUi} label="UI/Large 3.0" />
                          <PassPill ok={r.labels.aaaText} label="AAA 7.0" />
                        </div>
                      ) : (
                        <span className="text-[--metis-text-secondary]">—</span>
                      )
                    ) : r.separation ? (
                      <Badge className="border-0 bg-[--metis-surface-elevated] text-[--metis-text-secondary] shadow-[inset_0_0_0_1px_var(--metis-outline-subtle)]">
                        {r.separation}
                      </Badge>
                    ) : (
                      <span className="text-[--metis-text-secondary]">—</span>
                    )}
                  </td>
                  <td className="p-2 align-top text-xs leading-5 text-[--metis-text-secondary]">{r.pair.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-[1.2rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_36%,var(--metis-surface-page))] px-4 py-4">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Export (for verification)</p>
        <p className="text-sm leading-6 text-[--metis-text-secondary]">
          Copy this JSON to share exact computed values (dev-only; not a WCAG artifact).
        </p>
        <div className="rounded-lg border border-[--metis-outline-subtle] bg-[--metis-frame-soft] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Key pairs (requested)</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full px-4 text-xs"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(keyPairsJson);
                    setCopyState("copied");
                    window.setTimeout(() => setCopyState("idle"), 1500);
                  } catch {
                    setCopyState("error");
                    window.setTimeout(() => setCopyState("idle"), 1800);
                  }
                }}
              >
                Copy key pairs JSON
              </Button>
              {copyState === "copied" ? (
                <Badge className="border-0 bg-[--metis-status-success-bg] text-[--metis-status-success-fg]">Copied</Badge>
              ) : copyState === "error" ? (
                <Badge className="border-0 bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]">Copy failed</Badge>
              ) : null}
            </div>
          </div>
          <pre className="mt-2 max-h-[240px] overflow-auto text-[0.7rem] leading-5 text-[--metis-text-primary]">
            {keyPairsJson}
          </pre>
        </div>
        <pre className="max-h-[320px] overflow-auto rounded-lg border border-[--metis-outline-subtle] bg-[--metis-frame-soft] p-3 text-[0.7rem] leading-5 text-[--metis-text-primary]">
          {JSON.stringify(exportRows, null, 2)}
        </pre>
      </div>
      <Table title="Text contrast (WCAG)" items={grouped.text} showWcag />
      <Table title="UI boundary contrast (WCAG-ish)" items={grouped.ui} showWcag />
      <Table title="Layer separation (heuristic)" items={grouped.layer} showWcag={false} />
    </div>
  );
}

