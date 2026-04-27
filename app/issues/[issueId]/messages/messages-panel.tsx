"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MessageVariantArtifact } from "@metis/shared/messageVariant";
import { renderMessageVariantMarkdown } from "@/lib/messages/generateExternalCustomerUpdate";

type StakeholderOption = { id: string; label: string };

type LatestPayload = {
  id: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: string;
  issueStakeholderId: string | null;
  artifact: MessageVariantArtifact;
} | null;

export function MessagesPanel({
  issueId,
  issueTitle,
  issueUpdatedAt,
  stakeholderOptions,
  initialLatest,
}: {
  issueId: string;
  issueTitle: string;
  issueUpdatedAt: string;
  stakeholderOptions: StakeholderOption[];
  initialLatest: LatestPayload;
}) {
  const router = useRouter();
  const [latest, setLatest] = useState<LatestPayload>(initialLatest);
  const [stakeholderId, setStakeholderId] = useState<string>(() => {
    if (initialLatest?.issueStakeholderId) return initialLatest.issueStakeholderId;
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    setLatest(initialLatest);
  }, [initialLatest?.id, initialLatest?.versionNumber, initialLatest?.generatedFromIssueUpdatedAt]);

  const inSync = useMemo(() => {
    if (!latest) return false;
    return new Date(latest.generatedFromIssueUpdatedAt).getTime() === new Date(issueUpdatedAt).getTime();
  }, [latest, issueUpdatedAt]);

  const markdown = useMemo(() => {
    if (!latest) return "";
    return renderMessageVariantMarkdown(issueTitle, latest.artifact);
  }, [latest, issueTitle]);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/message-variants`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateId: "external_customer_resident_student",
          issueStakeholderId: stakeholderId ? stakeholderId : null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : `Failed (${res.status})`;
        throw new Error(msg);
      }
      const row = data as {
        id: string;
        versionNumber: number;
        generatedFromIssueUpdatedAt: string;
        issueStakeholderId: string | null;
        artifact: MessageVariantArtifact;
      };
      setLatest({
        id: row.id,
        versionNumber: row.versionNumber,
        generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt,
        issueStakeholderId: row.issueStakeholderId,
        artifact: row.artifact,
      });
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyMd() {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.14)] px-5 py-5 sm:px-6">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Audience lens</p>
        <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">
          Choose the linked audience for needs, risks, channel guidance, and tone. Leave as issue-level only if no stakeholder is linked.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block min-w-[min(100%,20rem)] flex-1 space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Primary audience</span>
            <select
              value={stakeholderId}
              onChange={(e) => setStakeholderId(e.target.value)}
              className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              <option value="">Issue-level audience only</option>
              {stakeholderOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" className="h-11 rounded-full px-6" disabled={loading} onClick={() => void generate()}>
            {loading ? "Generating…" : latest ? "Regenerate external update" : "Generate external update"}
          </Button>
        </div>
      </div>

      {latest ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Version {latest.versionNumber}</span>
              <span
                className={`rounded-full border px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] ${
                  inSync
                    ? "border-emerald-400/35 bg-[rgba(18,83,58,0.45)] text-emerald-50"
                    : "border-sky-400/35 bg-[rgba(19,86,118,0.55)] text-sky-50"
                }`}
              >
                {inSync ? "Up to date with issue record" : "Stale — issue changed since generation"}
              </span>
            </div>
            <Button type="button" variant="outline" className="rounded-full" disabled={!markdown} onClick={() => void copyMd()}>
              <Copy className="mr-2 h-4 w-4" />
              {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy Markdown"}
            </Button>
          </div>

          <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.12)] px-5 py-5 sm:px-6">
            <p className="font-[Cormorant_Garamond] text-2xl text-[--metis-paper]">{latest.artifact.metadata.publicHeadline}</p>
            <p className="mt-2 text-sm text-[--metis-paper-muted]">
              Audience: {latest.artifact.metadata.audienceLabel} · {latest.artifact.metadata.openGapsLabel}
            </p>
            {latest.artifact.metadata.issueLevelAudienceNote ? (
              <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-950/25 px-4 py-3 text-sm leading-6 text-amber-50/95">
                {latest.artifact.metadata.issueLevelAudienceNote}
              </p>
            ) : null}
          </div>

          <div className="space-y-6">
            {latest.artifact.sections.map((s) => (
              <section key={s.id} className="space-y-2 border-t border-white/8 pt-6 first:border-t-0 first:pt-0">
                <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.72)]">{s.title}</h3>
                <p className="whitespace-pre-line text-base leading-8 text-[--metis-paper]">{s.body}</p>
              </section>
            ))}
          </div>

          <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.18)] px-5 py-5 sm:px-6">
            <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.72)]">Guardrails (internal)</h3>
            <p className="mt-3 text-sm leading-7 text-[--metis-paper-muted]">{latest.artifact.guardrails.toneNotes}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-[--metis-paper-muted]">
              {latest.artifact.guardrails.mustAvoid.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-7 text-[--metis-paper-muted]">
          No external customer update has been generated yet. Choose an audience lens (optional) and click Generate.
        </p>
      )}
    </div>
  );
}
