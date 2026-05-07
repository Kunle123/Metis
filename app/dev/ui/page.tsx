"use client";

import { Copy } from "lucide-react";

import { MetisShell, ConfidencePill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconButton } from "@/components/ui/icon-button";
import { ControlField, ControlHelper, ControlLabel, ControlSelect } from "@/components/ui/control";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { AiProvenance } from "@/components/ui/ai-provenance";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewBanner } from "@/components/review/ReviewBanner";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";

import { ContrastAudit } from "@/app/dev/ui/contrast-audit.client";
import { DevUiRootTheme } from "@/app/dev/ui/dev-ui-root-theme.client";

/** Token-based panels so diagnostics read correctly when `html.light` is toggled on this route. */
const DEV_UI_INSET =
  "rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))]";

type Token = { name: string; sample: "bg" | "border" | "text" };

const tokens: Record<string, Token[]> = {
  "Layer tokens (semantic)": [
    { name: "--background", sample: "bg" },
    { name: "--card", sample: "bg" },
    { name: "--border", sample: "border" },
    { name: "--metis-control-bg", sample: "bg" },
    { name: "--metis-control-border", sample: "border" },
  ],
  "Accent (brass)": [
    { name: "--metis-accent", sample: "bg" },
    { name: "--metis-accent-soft", sample: "bg" },
    { name: "--metis-brass", sample: "bg" },
    { name: "--metis-brass-soft", sample: "bg" },
  ],
  "Info (blue)": [
    { name: "--metis-info", sample: "bg" },
    { name: "--metis-info-soft", sample: "bg" },
    { name: "--metis-info-bg", sample: "bg" },
    { name: "--metis-info-border", sample: "border" },
    { name: "--metis-info-ring", sample: "border" },
  ],
  Neutral: [
    { name: "--metis-frame", sample: "bg" },
    { name: "--metis-dark", sample: "bg" },
    { name: "--metis-paper", sample: "bg" },
    { name: "--metis-paper-muted", sample: "bg" },
    { name: "--metis-ink-soft", sample: "bg" },
    { name: "--background", sample: "bg" },
    { name: "--foreground", sample: "text" },
    { name: "--border", sample: "border" },
    { name: "--ring", sample: "border" },
  ],
  Controls: [
    { name: "--metis-control-bg", sample: "bg" },
    { name: "--metis-control-border", sample: "border" },
    { name: "--metis-control-inset", sample: "border" },
    { name: "--metis-secondary-bg", sample: "bg" },
    { name: "--metis-secondary-border", sample: "border" },
  ],
};

function TokenSwatch({ name, sample }: Token) {
  const style =
    sample === "bg"
      ? { background: `var(${name})` }
      : sample === "border"
        ? { borderColor: `var(${name})` }
        : { color: `var(${name})` };

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-[1.1rem] border border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,var(--metis-surface-page))] px-4 py-3`}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-[--metis-paper]">
          <code className="text-[--metis-paper]">{name}</code>
        </p>
        <p className="mt-1 text-xs text-[--metis-paper-muted]">Sample: {sample}</p>
      </div>
      <div
        className="h-10 w-20 shrink-0 rounded-lg border border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-page)_55%,var(--metis-surface-toolbar))]"
        style={style}
        aria-label={`Swatch for ${name}`}
      />
    </div>
  );
}

function LayerStackSample() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-[1.4rem] border border-[--metis-outline-subtle] bg-[--metis-surface-page] p-4">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Page frame</p>
        <div className="mt-3 rounded-[1.4rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] p-4">
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">App body</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="metis-surface metis-primary-surface rounded-[1.4rem] border p-4">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Primary surface</p>
              <div className="mt-3 rounded-[1.2rem] border border-[--metis-outline-subtle] bg-[--metis-surface-toolbar] px-4 py-3">
                <p className="text-xs text-[--metis-paper-muted]">Nested toolbar panel</p>
              </div>
            </div>
            <div className="metis-surface metis-support-surface rounded-[1.4rem] border p-4">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Support surface</p>
              <div className="mt-3 rounded-[1.2rem] border border-[--metis-info-border] bg-[--metis-info-bg] px-4 py-3">
                <p className="text-xs text-[--metis-paper-muted]">Info panel sample</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3 rounded-[1.4rem] border border-[--metis-outline-subtle] bg-[--metis-surface-rail] p-4">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-brass-soft]">Operable controls</p>
        <div className="grid gap-3">
          <div className="rounded-[1.2rem] border border-[--metis-control-border] bg-[--metis-control-bg] px-4 py-3 shadow-[inset_0_1px_0_var(--metis-control-inset)]">
            <p className="text-xs text-[--metis-text-primary]">Control background / border</p>
            <p className="mt-1 text-xs text-[--metis-text-secondary]">Operable, but quieter than the Primary button above.</p>
          </div>
          <ReviewBanner tone="warning" title="Warning" body="Amber panel separation check." />
          <ReviewBanner tone="info" title="Info" body="Blue panel separation check." />
        </div>
      </div>
    </div>
  );
}

function LightThemePrimitivesPreview() {
  return (
    <div className="rounded-[1.35rem] border border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-page)_35%,var(--metis-surface-card))] p-5 text-[--metis-text-primary] shadow-[var(--shadow-card)]">
      <div className="space-y-1">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">
          Primitives checklist (respects active root theme)
        </p>
        <p className="text-sm leading-6 text-[--metis-text-secondary]">
          Use the <strong className="font-medium text-[--metis-text-primary]">Light preview</strong> control above once — it swaps{" "}
          <code className="rounded-md border border-[--metis-outline-subtle] bg-[--metis-surface-card] px-1.5 py-0.5 text-[0.7rem] text-[--metis-text-primary]">
            html.dark
          </code>{" "}
          for{" "}
          <code className="rounded-md border border-[--metis-outline-subtle] bg-[--metis-surface-card] px-1.5 py-0.5 text-[0.7rem] text-[--metis-text-primary]">
            html.light
          </code>{" "}
          so inputs, placeholders, shell chrome, and this panel all consume the same light tokens.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
        <div className="space-y-5 rounded-[1.15rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] p-4">
          <div>
            <p className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Actions</p>
            <div className="mt-3 flex flex-wrap gap-[var(--metis-control-gap-md)]">
              <Button>Primary</Button>
              <Button variant="outline">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="info" size="sm">
                Info
              </Button>
              <Button disabled>Disabled primary</Button>
              <Button variant="outline" disabled>
                Disabled outline
              </Button>
            </div>
          </div>

          <div>
            <p className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Segmented rail</p>
            <div className="mt-3 flex flex-wrap gap-6">
              <div className="space-y-1">
                <p className="text-[0.65rem] text-[--metis-text-tertiary]">Selected vs idle</p>
                <SegmentedControl
                  label="Mode"
                  value="b"
                  options={[
                    { id: "a", label: "Alpha" },
                    { id: "b", label: "Beta" },
                  ]}
                  onChange={() => {}}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] text-[--metis-text-tertiary]">Disabled rail</p>
                <SegmentedControl
                  label="Frozen"
                  value="one"
                  disabled
                  options={[
                    { id: "one", label: "One" },
                    { id: "two", label: "Two" },
                  ]}
                  onChange={() => {}}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Switch</p>
            <div className="mt-3 flex flex-wrap gap-8">
              <Switch checked={false} onCheckedChange={() => {}} aria-label="Light preview off" />
              <Switch checked onCheckedChange={() => {}} aria-label="Light preview on" />
              <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="Light preview disabled off" />
              <Switch checked onCheckedChange={() => {}} disabled aria-label="Light preview disabled on" />
            </div>
          </div>

          <div>
            <p className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Chips · provenance</p>
            <div className="mt-3 flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
              <Badge className="border-[--metis-outline-subtle] bg-[--metis-surface-elevated] text-[--metis-text-secondary]">
                Outline badge
              </Badge>
              <AiProvenance mode="original" />
              <AiProvenance mode="ai" helper="Helper under headline" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]" htmlFor="light-preview-input">
                Input (token control layer)
              </label>
              <Input id="light-preview-input" readOnly defaultValue="Distinct from adjacent card fill" aria-label="Light preview input" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]" htmlFor="light-preview-textarea">
                Textarea
              </label>
              <Textarea id="light-preview-textarea" readOnly defaultValue="Document / preview tone should read flatter than operable chrome." aria-label="Light preview textarea" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Surface ladder (tokens)</p>
          <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-page] p-3">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Page</p>
            <p className="mt-2 text-xs text-[--metis-text-secondary]">Outer canvas inside the light subtree.</p>
          </div>
          <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] p-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_35%,transparent)]">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Card</p>
          </div>
          <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-elevated] p-3 shadow-[0_10px_28px_-8px_color-mix(in_oklab,var(--metis-text-primary)_12%,transparent)]">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Elevated</p>
          </div>
          <div className="rounded-[1rem] border border-[--metis-outline-strong] bg-[--metis-frame-soft] p-3">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Inset / preview</p>
            <p className="mt-2 text-[0.72rem] leading-5 text-[--metis-text-secondary]">Muted substrate vs card chrome.</p>
          </div>
          <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-toolbar] p-3">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Action/config slab</p>
          </div>
          <div className="rounded-[1rem] border border-[--metis-info-border] bg-[--metis-info-bg] p-3">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-info]">Optional info surface</p>
          </div>
          <div className="rounded-[1rem] border border-[--metis-status-success-border] bg-[--metis-status-success-bg] p-3">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[--metis-status-success-fg]">Status · success</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MetisUiDiagnosticsPage() {
  return (
    <MetisShell
      activePath="/dev/ui"
      pageTitle="Metis UI diagnostics"
      pageMeta="Internal visual inspection page"
    >
      <DevUiRootTheme>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard>
          <div className="border-b border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_42%,transparent)] px-6 py-5 sm:px-7">
            <ReviewToolbar
              left={
                <div className="space-y-1">
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">
                    Visual inspection of tokens, controls, and review surfaces. No DB/API calls.
                  </p>
                  <p className="text-xs leading-5 text-[--metis-paper-muted]">
                    Route: <code className="text-[--metis-paper]">/dev/ui</code>
                  </p>
                </div>
              }
              right={
                <div className="flex flex-wrap items-center justify-end gap-[var(--metis-control-gap-md)]">
                  <Button>Primary action</Button>
                  <Button variant="outline">Outline action</Button>
                </div>
              }
            />
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            <DenseSection title="Control foundations (Slice 1)">
              <p className="text-sm leading-7 text-[--metis-paper-muted]">
                Canonical examples for Metis control sizing, action hierarchy, and provenance motifs. Product pages should converge on these patterns.
              </p>

              <div className="mt-5 space-y-6">
                <div className={`space-y-5 ${DEV_UI_INSET} px-4 py-4 sm:px-5 sm:py-5`}>
                  <div>
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">
                      Control hierarchy (acceptance checks)
                    </p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[--metis-paper-muted]">
                      <li>A user should identify the primary action in under one second.</li>
                      <li>Metadata should not look like an action.</li>
                      <li>Disabled is unavailable; off/unselected is still available.</li>
                      <li>Status labels describe state; action links tell the user what to do.</li>
                    </ul>
                  </div>
                  <div className="border-t border-[--metis-outline-strong] pt-4">
                    <p className="text-xs font-medium text-[--metis-text-secondary]">Positive visual contracts (must read at a glance)</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[--metis-paper-muted]">
                      <li>
                        <span className="text-[--metis-paper]">Primary</span>: solid brass fill, dark label, strongest action contrast, tactile brass polish
                        — unmistakably the lead control; disabled reads as a flat gray slab (no brass polish).
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Secondary</span>: lifted neutral body + clear edge + inset/soft stack — reads as a real
                        button without competing with primary; hover/focus reinforce clickability.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Ghost</span>: no chassis at rest — readable text + hover underline; never a filled
                        secondary clone.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Info action</span>: blue/actionable body (not passive metadata) — weaker than primary,
                        never brass.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Chips / provenance</span>: short badge row, low mass, no button stack; long prose sits as
                        plain helper text below — not inside a pill.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Metadata</span>: inline tertiary copy only — zero button chrome.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Segmented</span>: recessed rail; selected = bright neutral slot + bold label + check
                        glyph (not brass CTA); disabled segments read “off limits.”
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Switch</span>: on/off energy only when enabled; disabled tracks/knobs are flat and
                        desaturated even if the knob stays “on-screen.”
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-5 border-t border-[--metis-outline-strong] pt-4">
                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Primary · Secondary · Ghost · Disabled
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
                        <Button>Primary action</Button>
                        <Button variant="outline">Secondary action</Button>
                        <Button variant="ghost">Tertiary / ghost</Button>
                        <Button disabled>Disabled primary</Button>
                        <Button variant="outline" disabled>
                          Disabled secondary
                        </Button>
                        <Button variant="ghost" disabled>
                          Disabled ghost
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Secondary on page · card · toolbar surfaces
                      </p>
                      <p className="mt-2 text-xs text-[--metis-text-tertiary]">
                        Secondary must stay visibly “clickable” (lifted neutral body), not dissolve into panels.
                      </p>
                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-page] p-4">
                          <p className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Page frame</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button size="sm">Publish</Button>
                            <Button variant="outline" size="sm">
                              Save draft
                            </Button>
                          </div>
                        </div>
                        <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] p-4">
                          <p className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Card panel</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button size="sm">Publish</Button>
                            <Button variant="outline" size="sm">
                              Save draft
                            </Button>
                          </div>
                        </div>
                        <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-toolbar] p-4">
                          <p className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Toolbar slab</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button size="sm">Publish</Button>
                            <Button variant="outline" size="sm">
                              Save draft
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Button · chip · metadata
                      </p>
                      <div className="mt-3 flex flex-wrap items-start gap-x-[var(--metis-control-gap-md)] gap-y-4">
                        <Button variant="outline">Secondary button</Button>
                        <AiProvenance mode="original" />
                        <AiProvenance mode="ai" helper="Short helper under the headline chip — avoids a mega-pill." className="max-w-[240px]" />
                        <span className="inline-block pt-2 text-xs tabular-nums text-[--metis-text-tertiary]">
                          Last saved · 09:41 UTC · v3
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Info action · provenance badge · passive helper note
                      </p>
                      <p className="mt-2 max-w-xl text-xs leading-5 text-[--metis-text-tertiary]">
                        This sentence is explanatory copy only (no border, no hover). Scan for the bordered info button vs compact provenance headline +
                        muted paragraph.
                      </p>
                      <div className="mt-3 flex flex-wrap items-start gap-x-[var(--metis-control-gap-md)] gap-y-4">
                        <Button type="button" variant="info" size="sm">
                          View sourcing context
                        </Button>
                        <AiProvenance mode="ai" variant="synthesis-available" className="max-w-[260px]" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Segmented · selected · unselected · disabled
                      </p>
                      <div className="mt-3 grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Selected A</p>
                          <SegmentedControl
                            label="Mode"
                            value="a"
                            options={[
                              { id: "a", label: "Alpha" },
                              { id: "b", label: "Beta" },
                            ]}
                            onChange={() => {}}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Selected B (contrast)</p>
                          <SegmentedControl
                            label="Mode"
                            value="b"
                            options={[
                              { id: "a", label: "Alpha" },
                              { id: "b", label: "Beta" },
                            ]}
                            onChange={() => {}}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                            Whole disabled / per-option off
                          </p>
                          <SegmentedControl
                            label="Frozen"
                            value="x"
                            disabled
                            options={[
                              { id: "x", label: "One" },
                              { id: "y", label: "Two" },
                            ]}
                            onChange={() => {}}
                          />
                          <SegmentedControl
                            className="pt-1"
                            label="Middle option disabled"
                            value="a"
                            options={[
                              { id: "a", label: "Alpha" },
                              { id: "b", label: "Beta", disabled: true },
                              { id: "c", label: "Gamma" },
                            ]}
                            onChange={() => {}}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Switch · enabled off / on · disabled off / on
                      </p>
                      <div className="mt-3 flex flex-wrap items-end gap-6">
                        <div className="flex flex-col items-center gap-2">
                          <Switch checked={false} onCheckedChange={() => {}} aria-label="Enabled off" />
                          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Enabled off</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Switch checked onCheckedChange={() => {}} aria-label="Enabled on" />
                          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Enabled on</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="Disabled off" />
                          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Disabled off</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Switch checked onCheckedChange={() => {}} disabled aria-label="Disabled on" />
                          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Disabled on</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Action label · status label
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-6">
                        <Button type="button" variant="ghost" className="px-0">
                          Open evidence trail
                        </Button>
                        <span
                          className="inline-flex items-center rounded-md border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_55%,transparent)] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[--metis-status-success-fg]"
                          title="Describes sync state — not an instruction"
                        >
                          Synced
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Button patterns (dense)</p>
                    <div className="flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
                      <Button>Primary</Button>
                      <Button variant="outline">Secondary</Button>
                      <Button variant="info" size="sm">
                        Info action
                      </Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button pill>Optional pill shape</Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
                      <Button>
                        <span
                          className="inline-block shrink-0 rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_22%,transparent)]"
                          style={{ width: "var(--metis-icon-size-md)", height: "var(--metis-icon-size-md)" }}
                          aria-hidden
                        />
                        Icon + label
                      </Button>
                      <IconButton
                        label="Icon-only sm (outline)"
                        size="sm"
                        icon={
                          <span
                            className="size-[var(--metis-icon-size-sm)] rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_22%,transparent)]"
                            aria-hidden
                          />
                        }
                      />
                      <IconButton
                        label="Icon-only md (outline)"
                        icon={
                          <span
                            className="size-[var(--metis-icon-size-md)] rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_22%,transparent)]"
                            aria-hidden
                          />
                        }
                      />
                      <IconButton
                        disabled
                        label="Icon-only outline disabled"
                        icon={
                          <span
                            className="size-[var(--metis-icon-size-md)] rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_16%,transparent)]"
                            aria-hidden
                          />
                        }
                      />
                      <IconButton
                        label="Icon-only info"
                        variant="info"
                        icon={
                          <span
                            className="size-[var(--metis-icon-size-md)] rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_12%,transparent)]"
                            aria-hidden
                          />
                        }
                      />
                      <IconButton
                        label="Icon-only md (primary)"
                        variant="default"
                        icon={<span className="size-[var(--metis-icon-size-md)] rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_18%,transparent)]" aria-hidden />}
                      />
                      <IconButton
                        label="Icon-only lg (primary)"
                        variant="default"
                        size="lg"
                        icon={<span className="size-[var(--metis-icon-size-lg)] rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_14%,transparent)]" aria-hidden />}
                      />
                      <IconButton
                        disabled
                        label="Icon-only md (primary, disabled)"
                        variant="default"
                        icon={<span className="size-[var(--metis-icon-size-md)] rounded bg-[color-mix(in_oklab,var(--metis-text-primary)_14%,transparent)]" aria-hidden />}
                      />
                    </div>
                    <div className="pt-1">
                      <ControlHelper>
                        Brass = primary/high-trust/identity accent. Blue/info = provenance, AI-enhanced indicators, contextual information, and occasional informational actions. Neutral = secondary controls, structure, and artifact content. Amber = warning (not brand brass). Rose-red = critical/destructive/risk. Secondary actions should generally be neutral, not brass. Disabled states use dedicated tokens and should never rely on opacity alone.
                      </ControlHelper>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Sizing system</p>
                    <div className="flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
                      <Button size="sm">sm · compact</Button>
                      <Button size="md">md · default</Button>
                      <Button size="lg">lg · large</Button>
                    </div>
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Chip vs Copy (alignment)</p>
                    <div className="flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
                      <AiProvenance mode="original" />
                      <AiProvenance mode="ai" />
                      <Button type="button" variant="outline" aria-label="Copy markdown preview">
                        <Copy className="shrink-0" aria-hidden />
                        Copy markdown
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ControlField label="Select" helper="Labels have breathing room; helper text is secondary.">
                        <ControlSelect defaultValue="a" aria-label="Example select">
                          <option value="a">Option A</option>
                          <option value="b">Option B</option>
                        </ControlSelect>
                      </ControlField>
                      <ControlField label="Select (disabled)">
                        <ControlSelect disabled defaultValue="a" aria-label="Example select disabled">
                          <option value="a">Disabled</option>
                        </ControlSelect>
                      </ControlField>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Segmented controls (view/mode)</p>
                    <div className="grid gap-3">
                      <SegmentedControl
                        label="Original / AI-enhanced"
                        value={"original"}
                        options={[
                          { id: "original", label: "Original" },
                          { id: "ai", label: "AI-enhanced" },
                        ]}
                        onChange={() => {}}
                      />
                      <SegmentedControl
                        label="Full / Executive"
                        value={"full"}
                        options={[
                          { id: "full", label: "Full" },
                          { id: "executive", label: "Executive" },
                        ]}
                        onChange={() => {}}
                      />
                      <SegmentedControl
                        label="Disabled example"
                        value={"original"}
                        options={[
                          { id: "original", label: "Original" },
                          { id: "ai", label: "AI-enhanced" },
                        ]}
                        disabled
                        onChange={() => {}}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Switch (binary state)</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="space-y-1">
                        <ControlLabel>Setting</ControlLabel>
                        <div className="flex items-center gap-3">
                          <Switch checked={false} onCheckedChange={() => {}} aria-label="Off switch example" />
                          <span className="text-sm text-[--metis-paper-muted]">Off</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <ControlLabel>Setting</ControlLabel>
                        <div className="flex items-center gap-3">
                          <Switch checked onCheckedChange={() => {}} aria-label="On switch example" />
                          <span className="text-sm text-[--metis-paper-muted]">On</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <ControlLabel>Setting (disabled)</ControlLabel>
                        <div className="flex items-center gap-3">
                          <Switch checked onCheckedChange={() => {}} disabled aria-label="Disabled ON switch example" />
                          <span className="text-sm text-[--metis-paper-muted]">Disabled (On)</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <ControlLabel>Setting (disabled)</ControlLabel>
                        <div className="flex items-center gap-3">
                          <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="Disabled OFF switch example" />
                          <span className="text-sm text-[--metis-paper-muted]">Disabled (Off)</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-1">
                      <ControlHelper>Switches are for true on/off state. Segmented controls are for view/mode selection.</ControlHelper>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">AI provenance motif (subtle)</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <AiProvenance mode="original" />
                      <AiProvenance mode="ai" />
                    </div>
                    <div className="pt-1">
                      <ControlHelper>Blue/info is used for provenance and context — not approval. Avoid green badges for AI.</ControlHelper>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Surface hierarchy</p>
                    <div className="grid gap-3">
                      <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[--metis-surface-toolbar] px-4 py-3">
                        <p className="text-xs text-[--metis-paper-muted]">Controls toolbar surface</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-page)_62%,var(--metis-surface-card))] px-4 py-3">
                        <p className="text-xs text-[--metis-paper-muted]">Artifact/output surface</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-[--metis-info-border] bg-[--metis-info-bg] px-4 py-3">
                        <p className="text-xs text-[--metis-paper-muted]">Info/context surface (blue)</p>
                      </div>
                      <ReviewBanner tone="warning" title="Warning surface" body="Warning remains amber/red — separate from info blue." />
                    </div>
                  </div>
                </div>
              </div>
            </DenseSection>

            <DenseSection title="Light theme · primitives checklist">
              <p className="text-sm leading-7 text-[--metis-paper-muted]">
                With <strong className="text-[--metis-paper]">Light preview</strong> enabled, everything below uses{" "}
                <code className="text-[--metis-paper]">html.light</code> tokens. Focus rings use <code className="text-[--metis-paper]">--metis-ring-offset</code>{" "}
                so the offset matches the active canvas.
              </p>
              <div className="mt-5">
                <LightThemePrimitivesPreview />
              </div>
            </DenseSection>

            <DenseSection title="Layer stack samples">
              <p className="text-sm leading-7 text-[--metis-paper-muted]">
                Intended semantic layers: page frame → primary surface → nested panels/controls → rails/info panels.
              </p>
              <div className="mt-4">
                <LayerStackSample />
              </div>
            </DenseSection>

            <DenseSection title="Contrast audit">
              <p className="text-sm leading-7 text-[--metis-paper-muted]">
                Objective measurements using browser-computed colors. WCAG ratios are for text/UI boundaries; layer separation is an internal heuristic for visual hierarchy.
              </p>
              <div className="mt-4">
                <ContrastAudit />
              </div>
            </DenseSection>

            <DenseSection title="Colour tokens">
              <div className="grid gap-4 lg:grid-cols-2">
                {Object.entries(tokens).map(([group, groupTokens]) => (
                  <div
                    key={group}
                    className="space-y-3 rounded-[1.2rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4"
                  >
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">{group}</p>
                    <div className="space-y-2.5">
                      {groupTokens.map((t) => (
                        <TokenSwatch key={t.name} {...t} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DenseSection>

            <DenseSection title="Review primitives">
              <div className="space-y-4">
                <ReviewToolbar
                  left={
                    <div className="space-y-1">
                      <p className="text-xs text-[--metis-paper-muted]">ReviewToolbar (left)</p>
                      <p className="text-sm text-[--metis-paper]">Template / Audience selectors go here.</p>
                    </div>
                  }
                  right={
                    <div className="flex items-center gap-2">
                      <Button>Generate</Button>
                      <Button variant="outline">Copy</Button>
                    </div>
                  }
                />

                <div className="flex flex-col gap-2">
                  <ReviewBanner tone="warning" title="Draft for review" body="Warning tone sample." />
                  <ReviewBanner tone="info" title="Info" body="Info tone sample (semantic blue)." />
                  <ReviewBanner tone="neutral" title="Neutral" body="Neutral tone sample." />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ReviewRailCard title="ReviewRailCard (neutral)" meta={<span>Neutral rail card sample.</span>}>
                    <div className="text-sm text-[--metis-paper-muted]">Body content</div>
                  </ReviewRailCard>
                  <ReviewRailCard title="ReviewRailCard (info)" tone="info" meta={<span>Info rail card sample.</span>}>
                    <div className="text-sm text-[--metis-paper-muted]">Body content</div>
                  </ReviewRailCard>
                </div>

                <CollapsibleSection
                  defaultOpen={false}
                  summary={
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[--metis-text-tertiary]">
                        CollapsibleSection
                      </span>
                      <Badge>Collapsed by default</Badge>
                    </div>
                  }
                >
                  <p className="text-sm leading-7 text-[--metis-paper-muted]">Collapsible content goes here.</p>
                </CollapsibleSection>
              </div>
            </DenseSection>

            <DenseSection title="Common controls">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-[--metis-brass]/15 text-[--metis-brass-soft]">Selected pill</Badge>
                <Badge className="border-0 bg-[--metis-status-warning-bg] text-[--metis-status-warning-fg]">Open questions · 3</Badge>
                <Badge className="border-0 bg-[--metis-status-success-bg] text-[--metis-status-success-fg]">Up to date</Badge>
                <Badge className="border-0 bg-[--metis-status-info-bg] text-[--metis-status-info-fg]">Stale</Badge>
                <ConfidencePill level="Confirmed" />
                <ConfidencePill level="Likely" />
                <ConfidencePill level="Unclear" />
                <ConfidencePill level="Needs validation" />
                <span className="text-xs text-[--metis-text-tertiary]">Updated since last version · metadata as plain text</span>
                <span className="text-xs text-[--metis-text-secondary]">Ready for review</span>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Input</span>
                  <input
                    className="h-10 w-full rounded-[var(--metis-control-radius-md)] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                    placeholder="Text input"
                    defaultValue="Example value"
                    readOnly
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Select</span>
                  <select className="h-10 w-full rounded-[var(--metis-control-radius-md)] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60">
                    <option>Option A</option>
                    <option>Option B</option>
                  </select>
                </label>
              </div>
            </DenseSection>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface">
          <div className="space-y-4 px-5 py-5">
            <ReviewRailCard title="Mini Brief rail" tone="info" meta={<span>Metadata / sync sample</span>}>
              <div className="space-y-2 text-sm leading-6 text-[--metis-paper-muted]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Mode</span>
                  <span className="rounded-full border border-[--metis-status-neutral-border] bg-[--metis-status-neutral-bg] px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-secondary]">
                    Executive
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[--metis-outline-strong] pt-2">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Sync</span>
                  <span className="rounded-full border border-[--metis-outline-subtle] bg-[--metis-surface-toolbar] px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-[--metis-text-secondary]">
                    Stale
                  </span>
                </div>
              </div>
            </ReviewRailCard>

            <ReviewRailCard
              title="Mini Messages warning"
              tone="info"
              meta={<ReviewBanner title="Draft for review" body="Not approved for circulation." tone="warning" />}
            >
              <div className="text-sm leading-6 text-[--metis-paper-muted]">Audience group · General (no audience group)</div>
            </ReviewRailCard>

            <ReviewRailCard title="Evidence row sample" tone="info" meta={<span>Source metadata</span>}>
              <div className="space-y-2 text-sm leading-6 text-[--metis-paper-muted]">
                <p className="text-[--metis-paper]">SRC-019 · Vendor status update</p>
                <p className="text-xs text-[--metis-paper-muted]">Tier: Official · Section: Chronology · Reliability: High</p>
              </div>
            </ReviewRailCard>

            <ReviewRailCard title="Gap row sample" meta={<span>Severity + resolution context</span>}>
              <div className="space-y-2 text-sm leading-6 text-[--metis-paper-muted]">
                <p className="text-[--metis-paper]">Can we confirm impact scope by region?</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-[--metis-status-warning-bg] text-[--metis-status-warning-fg]">Open</Badge>
                  <Badge className="border-0 bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]">Critical</Badge>
                </div>
              </div>
            </ReviewRailCard>

            <ReviewRailCard title="Observation row sample" meta={<span>Include/exclude + confidence</span>}>
              <div className="space-y-2 text-sm leading-6 text-[--metis-paper-muted]">
                <p className="text-[--metis-paper]">On-call · A. Name</p>
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidencePill level="Likely" />
                  <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_58%,var(--metis-surface-page))] text-[--metis-status-danger-fg]">
                    Excluded
                  </Badge>
                </div>
              </div>
            </ReviewRailCard>
          </div>
        </SurfaceCard>
      </div>
      </DevUiRootTheme>
    </MetisShell>
  );
}

