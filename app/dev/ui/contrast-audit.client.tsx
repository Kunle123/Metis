"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
  css: string;
  rgba: Rgba | null;
};

function separationNote(ratio: number) {
  if (ratio < 1.15) return "Weak (near-indistinguishable)";
  if (ratio < 1.35) return "Subtle";
  if (ratio < 1.75) return "Clear";
  return "Strong";
}

function resolveTokenColor(token: string, property: "color" | "backgroundColor" | "borderColor"): Resolved {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  el.style.top = "-9999px";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.border = "1px solid transparent";
  el.style.backgroundColor = "transparent";
  el.style.color = "transparent";

  if (property === "borderColor") el.style.borderTopColor = `var(${token})`;
  if (property === "backgroundColor") el.style.backgroundColor = `var(${token})`;
  if (property === "color") el.style.color = `var(${token})`;

  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const css =
    property === "borderColor" ? cs.borderTopColor : property === "backgroundColor" ? cs.backgroundColor : cs.color;
  document.body.removeChild(el);

  return { token, css, rgba: parseCssColor(css) };
}

function tokenPropertyForKind(kind: Pair["kind"], which: "fg" | "bg"): "color" | "backgroundColor" | "borderColor" {
  if (kind === "text") return which === "fg" ? "color" : "backgroundColor";
  if (kind === "ui") return which === "fg" ? "borderColor" : "backgroundColor";
  // layer
  return "backgroundColor";
}

function PassPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge className={ok ? "border-0 bg-emerald-900/35 text-emerald-50" : "border-0 bg-rose-900/35 text-rose-50"}>
      {label}: {ok ? "PASS" : "FAIL"}
    </Badge>
  );
}

function ColorChip({ rgba }: { rgba: Rgba }) {
  return <span className="inline-block h-5 w-8 rounded-md border border-white/12" style={{ background: rgbaToCss(rgba) }} />;
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
      <div className="space-y-3 rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">{title}</p>
            {title === "Layer separation (heuristic)" ? (
              <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">
                This is an internal heuristic for visual hierarchy, not a WCAG requirement.
              </p>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs text-[--metis-paper-muted]">
                <th className="sticky left-0 z-10 bg-[rgba(0,0,0,0.18)] p-2">Pair</th>
                <th className="p-2">FG token</th>
                <th className="p-2">BG token</th>
                <th className="p-2">Computed FG</th>
                <th className="p-2">Computed BG</th>
                <th className="p-2">Ratio</th>
                {showWcag ? <th className="p-2">WCAG</th> : <th className="p-2">Separation</th>}
                <th className="p-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.pair.id} className="border-t border-white/8">
                  <td className="sticky left-0 z-10 bg-[rgba(0,0,0,0.18)] p-2 align-top">
                    <code className="text-xs text-[--metis-paper]">{r.pair.id}</code>
                  </td>
                  <td className="p-2 align-top">
                    <code className="text-xs text-[--metis-paper]">{r.pair.fg}</code>
                  </td>
                  <td className="p-2 align-top">
                    <code className="text-xs text-[--metis-paper]">{r.pair.bg}</code>
                  </td>
                  <td className="p-2 align-top">
                    {r.fg.rgba ? (
                      <div className="flex items-center gap-2">
                        <ColorChip rgba={r.fg.rgba} />
                        <div className="text-xs text-[--metis-paper-muted]">
                          <div className="text-[--metis-paper]">{rgbaToHex(r.fg.rgba)}</div>
                          <div>{r.fg.css}</div>
                        </div>
                      </div>
                    ) : (
                      <Badge className="border-0 bg-rose-900/35 text-rose-50">Unresolved</Badge>
                    )}
                  </td>
                  <td className="p-2 align-top">
                    {r.bg.rgba ? (
                      <div className="flex items-center gap-2">
                        <ColorChip rgba={r.bg.rgba} />
                        <div className="text-xs text-[--metis-paper-muted]">
                          <div className="text-[--metis-paper]">{rgbaToHex(r.bg.rgba)}</div>
                          <div>{r.bg.css}</div>
                        </div>
                      </div>
                    ) : (
                      <Badge className="border-0 bg-rose-900/35 text-rose-50">Unresolved</Badge>
                    )}
                  </td>
                  <td className="p-2 align-top">
                    {r.ratio != null ? (
                      <span className="font-medium text-[--metis-paper]">{r.ratio.toFixed(2)}:1</span>
                    ) : (
                      <span className="text-[--metis-paper-muted]">—</span>
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
                        <span className="text-[--metis-paper-muted]">—</span>
                      )
                    ) : r.separation ? (
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{r.separation}</Badge>
                    ) : (
                      <span className="text-[--metis-paper-muted]">—</span>
                    )}
                  </td>
                  <td className="p-2 align-top text-xs leading-5 text-[--metis-paper-muted]">{r.pair.note}</td>
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
      <Table title="Text contrast (WCAG)" items={grouped.text} showWcag />
      <Table title="UI boundary contrast (WCAG-ish)" items={grouped.ui} showWcag />
      <Table title="Layer separation (heuristic)" items={grouped.layer} showWcag={false} />
    </div>
  );
}

