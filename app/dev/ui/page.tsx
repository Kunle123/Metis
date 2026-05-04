"use client";

import { Copy } from "lucide-react";

import { MetisShell, ConfidencePill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export const dynamic = "force-static";

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
    <div className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[--metis-paper]">
          <code className="text-[--metis-paper]">{name}</code>
        </p>
        <p className="mt-1 text-xs text-[--metis-paper-muted]">Sample: {sample}</p>
      </div>
      <div
        className="h-10 w-20 shrink-0 rounded-lg border border-white/10 bg-[rgba(0,0,0,0.18)]"
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

export default function MetisUiDiagnosticsPage() {
  return (
    <MetisShell
      activePath="/dev/ui"
      pageTitle="Metis UI diagnostics"
      pageMeta="Internal visual inspection page"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard>
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.02)] px-6 py-5 sm:px-7">
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
                <div className="space-y-5 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-4 sm:px-5 sm:py-5">
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
                  <div className="border-t border-white/8 pt-4">
                    <p className="text-xs font-medium text-[--metis-text-secondary]">Strict roles (local grouping)</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[--metis-paper-muted]">
                      <li>
                        <span className="text-[--metis-paper]">Primary</span> — at most one per local group; filled brass; highest visual weight.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Secondary</span> — neutral framed surface; clearly below primary (no lift/shadow stack).
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Ghost / tertiary</span> — text-first; underline on hover; no filled “button” slab.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Info / context action</span> — blue surface; never the default CTA.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Metadata</span> — plain secondary text or a very light chip; not pill-by-default; not tappable chrome.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Provenance chip</span> — compact (below control height); lighter than actions.
                      </li>
                      <li>
                        <span className="text-[--metis-paper]">Status label</span> — communicates state; interactive only when it is explicitly a control.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-5 border-t border-white/8 pt-4">
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
                        Button · chip · metadata
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
                        <Button variant="outline">Secondary button</Button>
                        <AiProvenance mode="original" />
                        <AiProvenance mode="ai" helper="Short line for the rail." className="max-w-[min(100%,260px)]" />
                        <span className="text-xs tabular-nums text-[--metis-text-tertiary]">Last saved · 09:41 UTC · v3</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        Info action · AI provenance chip
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-[var(--metis-control-gap-md)]">
                        <Button type="button" variant="info" size="sm">
                          View sourcing context
                        </Button>
                        <AiProvenance mode="ai" variant="synthesis-available" className="max-w-[min(100%,320px)]" />
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
                  <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-4">
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
                          className="inline-block shrink-0 rounded bg-black/25"
                          style={{ width: "var(--metis-icon-size-md)", height: "var(--metis-icon-size-md)" }}
                          aria-hidden
                        />
                        Icon + label
                      </Button>
                      <IconButton
                        label="Icon-only sm (outline)"
                        size="sm"
                        icon={<span className="size-[var(--metis-icon-size-sm)] rounded bg-white/25" aria-hidden />}
                      />
                      <IconButton label="Icon-only md (outline)" icon={<span className="size-[var(--metis-icon-size-md)] rounded bg-white/25" aria-hidden />} />
                      <IconButton
                        disabled
                        label="Icon-only outline disabled"
                        icon={<span className="size-[var(--metis-icon-size-md)] rounded bg-white/18" aria-hidden />}
                      />
                      <IconButton
                        label="Icon-only info"
                        variant="info"
                        icon={<span className="size-[var(--metis-icon-size-md)] rounded bg-white/12" aria-hidden />}
                      />
                      <IconButton
                        label="Icon-only md (primary)"
                        variant="default"
                        icon={<span className="size-[var(--metis-icon-size-md)] rounded bg-black/20" aria-hidden />}
                      />
                      <IconButton
                        label="Icon-only lg (primary)"
                        variant="default"
                        size="lg"
                        icon={<span className="size-[var(--metis-icon-size-lg)] rounded bg-black/15" aria-hidden />}
                      />
                      <IconButton
                        disabled
                        label="Icon-only md (primary, disabled)"
                        variant="default"
                        icon={<span className="size-[var(--metis-icon-size-md)] rounded bg-black/15" aria-hidden />}
                      />
                    </div>
                    <div className="pt-1">
                      <ControlHelper>
                        Brass = primary/high-trust/identity accent. Blue/info = provenance, AI-enhanced indicators, contextual information, and occasional informational actions. Neutral = secondary controls, structure, and artifact content. Amber = warning (not brand brass). Rose-red = critical/destructive/risk. Secondary actions should generally be neutral, not brass. Disabled states use dedicated tokens and should never rely on opacity alone.
                      </ControlHelper>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-4">
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
                  <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-4">
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

                  <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-4">
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
                  <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">AI provenance motif (subtle)</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <AiProvenance mode="original" />
                      <AiProvenance mode="ai" />
                    </div>
                    <div className="pt-1">
                      <ControlHelper>Blue/info is used for provenance and context — not approval. Avoid green badges for AI.</ControlHelper>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-4">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Surface hierarchy</p>
                    <div className="grid gap-3">
                      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(0,0,0,0.14)] px-4 py-3">
                        <p className="text-xs text-[--metis-paper-muted]">Controls toolbar surface</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(0,0,0,0.10)] px-4 py-3">
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
                  <div key={group} className="space-y-3 rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-4">
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
                      <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.72)]">
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
                <Badge className="border-0 bg-[rgba(124,78,18,0.6)] text-amber-50">Open questions · 3</Badge>
                <Badge className="border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50">Up to date</Badge>
                <Badge className="border-0 bg-[rgba(19,86,118,0.55)] text-sky-50">Stale</Badge>
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
                <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-2">
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
                  <Badge className="border-0 bg-[rgba(124,78,18,0.6)] text-amber-50">Open</Badge>
                  <Badge className="border-0 bg-[rgba(132,26,42,0.62)] text-rose-50">Critical</Badge>
                </div>
              </div>
            </ReviewRailCard>

            <ReviewRailCard title="Observation row sample" meta={<span>Include/exclude + confidence</span>}>
              <div className="space-y-2 text-sm leading-6 text-[--metis-paper-muted]">
                <p className="text-[--metis-paper]">On-call · A. Name</p>
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidencePill level="Likely" />
                  <Badge className="border-0 bg-rose-900/25 text-rose-50">Excluded</Badge>
                </div>
              </div>
            </ReviewRailCard>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

