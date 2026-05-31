import { prisma } from "@/lib/db/prisma";
import { formatClaimCode, formatGapCode } from "@/lib/issueRecordCodes";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";
import {
  briefArtifactToRecordSections,
  messageArtifactGuardrails,
  messageArtifactPrimaryBody,
  messageArtifactRecordSections,
  messageArtifactWording,
  parseBriefArtifact,
  parseMessageArtifact,
} from "./issueHistoryArtifactDetail";
import {
  loadIssueHistoryDisplayRegistry,
  resolveRelatedRecordIds,
} from "./issueHistoryDisplayCodes";

import { groupIssueHistoryRecordAdditions } from "./groupIssueHistoryRecordAdditions";
import { issueHistoryPerfLog, issueHistoryPerfStart } from "./issueHistoryPerf";
import { formatIssueHistoryAxisTime } from "./issueHistoryTime";
import type {
  IssueHistoryEventCard,
  IssueHistoryImpactSummary,
  IssueHistoryModalPayload,
  IssueHistoryTimelinePayload,
  IssueHistoryTruncation,
} from "./issueHistoryTypes";
import { ISSUE_HISTORY_MAX_EVENTS } from "./issueHistoryTypes";

export type IssueHistoryViewer = {
  membershipRole: string;
  userId: string;
};

function row(
  timestamp: string,
  partial: Omit<IssueHistoryEventCard, "timestamp" | "displayTime" | "day" | "time">,
): IssueHistoryEventCard {
  const axis = formatIssueHistoryAxisTime(timestamp);
  return {
    timestamp,
    displayTime: axis.displayTime,
    day: axis.day,
    time: axis.time,
    ...partial,
  };
}

function chipsFromImpact(summary: IssueHistoryImpactSummary): string[] {
  const chips: string[] = [];
  if (summary.sourcesLinked) chips.push(`+${summary.sourcesLinked} sources`);
  if (summary.claimsAdded) chips.push(`+${summary.claimsAdded} claims`);
  if (summary.claimsUpdated) chips.push(`${summary.claimsUpdated} claims updated`);
  if (summary.questionsOpened) chips.push(`+${summary.questionsOpened} open questions`);
  if (summary.questionsClosed) chips.push(`${summary.questionsClosed} questions closed`);
  if (summary.observationsAdded) chips.push(`+${summary.observationsAdded} observations`);
  if (summary.statusUpdated) chips.push("Status updated");
  return chips;
}

function templateBadge(templateId: string): string {
  const map: Record<string, string> = {
    internal_staff_update: "STAFF MESSAGE",
    external_customer_resident_student: "CUSTOMER MESSAGE",
    media_holding_line: "PRESS LINE",
  };
  return map[templateId] ?? templateId.replace(/_/g, " ").toUpperCase();
}

function messageTemplateDisplayName(templateId: string): string {
  switch (templateId) {
    case "internal_staff_update":
      return "Internal staff update";
    case "media_holding_line":
      return "Media holding line";
    case "external_customer_resident_student":
      return "External customer update";
    default:
      return templateId.replace(/_/g, " ");
  }
}

function briefBadge(mode: string): string {
  return mode === "executive" ? "EXECUTIVE BRIEF" : "FULL BRIEF";
}

function truncate(text: string, max = 140): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function capEvents(events: IssueHistoryEventCard[]): {
  events: IssueHistoryEventCard[];
  truncation: IssueHistoryTruncation;
} {
  const total = events.length;
  if (total <= ISSUE_HISTORY_MAX_EVENTS) {
    return {
      events,
      truncation: { totalEvents: total, showingEvents: total, capped: false },
    };
  }
  const sorted = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const capped = sorted.slice(-ISSUE_HISTORY_MAX_EVENTS);
  return {
    events: capped,
    truncation: {
      totalEvents: total,
      showingEvents: capped.length,
      capped: true,
    },
  };
}

export async function buildIssueHistoryTimeline(
  issueId: string,
  viewer: IssueHistoryViewer,
): Promise<IssueHistoryTimelinePayload> {
  const endTotal = issueHistoryPerfStart("buildIssueHistoryTimeline (total)");

  const endFetch = issueHistoryPerfStart("prisma parallel fetch");
  const [
    issue,
    internalInputs,
    sources,
    claims,
    gaps,
    briefVersions,
    messageVariants,
    artifactExports,
    circulationEvents,
    briefComparisons,
    claimInternalLinks,
  ] = await Promise.all([
    (async () => {
      const end = issueHistoryPerfStart("query issue");
      const r = await prisma.issue.findUniqueOrThrow({
        where: { id: issueId },
        select: { id: true, title: true, summary: true, status: true, operatorPosture: true },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query internalInputs");
      const r = await prisma.internalInput.findMany({
        where: prismaWhereInternalInputsVisibleToViewer(issueId, viewer),
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          role: true,
          name: true,
          confidence: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query sources");
      const r = await prisma.source.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          sourceCode: true,
          title: true,
          tier: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query claims");
      const r = await prisma.claim.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          claimNumber: true,
          text: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query gaps");
      const r = await prisma.gap.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          gapNumber: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          resolvedByInternalInputId: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query briefVersions");
      const r = await prisma.briefVersion.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          mode: true,
          versionNumber: true,
          circulationState: true,
          createdAt: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query messageVariants");
      const r = await prisma.messageVariant.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          templateId: true,
          versionNumber: true,
          approvalStatus: true,
          createdAt: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query artifactExports");
      const r = await prisma.artifactExport.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          format: true,
          filename: true,
          approvalStatus: true,
          createdAt: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query circulationEvents");
      const r = await prisma.circulationEvent.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          eventType: true,
          channel: true,
          audienceLabel: true,
          postureState: true,
          createdAt: true,
          briefVersionId: true,
          exportId: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query briefComparisons");
      const r = await prisma.briefComparison.findMany({
        where: { issueId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          mode: true,
          changeCount: true,
          createdAt: true,
          fromBriefVersionId: true,
          toBriefVersionId: true,
        },
      });
      end();
      return r;
    })(),
    (async () => {
      const end = issueHistoryPerfStart("query claimInternalLinks");
      const r = await prisma.claimInternalInput.findMany({
        where: { claim: { issueId } },
        select: { claimId: true, internalInputId: true },
      });
      end();
      return r;
    })(),
  ]);
  endFetch();

  const endAssembly = issueHistoryPerfStart("projection assembly");
  const claimById = new Map(claims.map((c) => [c.id, c] as const));
  const claimsByInput = new Map<string, typeof claims>();
  for (const link of claimInternalLinks) {
    const claim = claimById.get(link.claimId);
    if (!claim) continue;
    const list = claimsByInput.get(link.internalInputId) ?? [];
    list.push(claim);
    claimsByInput.set(link.internalInputId, list);
  }

  const events: IssueHistoryEventCard[] = [];

  for (const input of internalInputs) {
    const linkedClaims = claimsByInput.get(input.id) ?? [];
    const closedGaps = gaps.filter((g) => g.resolvedByInternalInputId === input.id);

    const impactSummary: IssueHistoryImpactSummary = {};
    if (linkedClaims.length) impactSummary.claimsAdded = linkedClaims.length;
    if (closedGaps.length) impactSummary.questionsClosed = closedGaps.length;
    const hasImpact = linkedClaims.length > 0 || closedGaps.length > 0;

    events.push(
      row(input.createdAt.toISOString(), {
        id: `incoming:${input.id}`,
        lane: "incoming_update",
        title: input.name.trim() || "Update received",
        subtitle: `${input.role.trim()} · ${input.confidence}`,
        badge: input.role.trim().toUpperCase() || "UPDATE",
        linkedRecordType: "InternalInput",
        linkedRecordId: input.id,
        relatedRecordIds: [...linkedClaims.map((c) => c.id), ...closedGaps.map((g) => g.id)],
        modalType: "incoming_update",
        impactSummary: hasImpact ? impactSummary : undefined,
        impactChips: hasImpact ? chipsFromImpact(impactSummary) : undefined,
      }),
    );

    if (hasImpact) {
      const impactSubtitle = chipsFromImpact(impactSummary).join(" · ");
      events.push(
        row(input.createdAt.toISOString(), {
          id: `record-update:${input.id}`,
          lane: "issue_record",
          title: `Issue record updated from ${input.name.trim() || "update"}`,
          subtitle: impactSubtitle || "Issue record updated",
          badge: "RECORD UPDATED",
          linkedRecordType: "issue_record_update",
          linkedRecordId: `${input.id}::issue_record_update`,
          relatedRecordIds: [input.id, ...linkedClaims.map((c) => c.id), ...closedGaps.map((g) => g.id)],
          modalType: "issue_record_update",
          impactSummary,
          impactChips: chipsFromImpact(impactSummary),
        }),
      );
    }
  }

  for (const source of sources) {
    events.push(
      row(source.createdAt.toISOString(), {
        id: `source:${source.id}`,
        lane: "issue_record",
        title: source.title,
        subtitle: `${source.sourceCode} · ${source.tier}`,
        badge: "SOURCE LINKED",
        linkedRecordType: "Source",
        linkedRecordId: source.id,
        modalType: "source",
      }),
    );
  }

  for (const claim of claims) {
    const code = formatClaimCode(claim.claimNumber) ?? "CLM";
    events.push(
      row(claim.createdAt.toISOString(), {
        id: `claim:${claim.id}`,
        lane: "issue_record",
        title: truncate(claim.text, 72),
        subtitle: `${code} · ${claim.status}`,
        badge: "CLAIM ADDED",
        linkedRecordType: "Claim",
        linkedRecordId: claim.id,
        modalType: "claim",
      }),
    );

    if (claim.updatedAt.getTime() - claim.createdAt.getTime() > 2000) {
      events.push(
        row(claim.updatedAt.toISOString(), {
          id: `claim-updated:${claim.id}`,
          lane: "issue_record",
          title: `${code} updated`,
          subtitle: claim.status,
          badge: "CLAIM UPDATED",
          linkedRecordType: "Claim",
          linkedRecordId: claim.id,
          modalType: "claim",
          impactSummary: { claimsUpdated: 1 },
          impactChips: ["Claim updated"],
        }),
      );
    }
  }

  for (const gap of gaps) {
    const code = formatGapCode(gap.gapNumber) ?? "Q";
    events.push(
      row(gap.createdAt.toISOString(), {
        id: `gap:${gap.id}`,
        lane: "issue_record",
        title: gap.title,
        subtitle: `${code} · ${gap.status}`,
        badge: "OPEN QUESTION",
        linkedRecordType: "Gap",
        linkedRecordId: gap.id,
        modalType: "gap",
      }),
    );

    const isResolved =
      (gap.status === "Resolved" || gap.status === "Closed") &&
      gap.resolvedByInternalInputId &&
      gap.updatedAt.getTime() > gap.createdAt.getTime() + 1000;

    if (isResolved) {
      events.push(
        row(gap.updatedAt.toISOString(), {
          id: `gap-resolved:${gap.id}`,
          lane: "issue_record",
          title: `${code} resolved`,
          subtitle: gap.title,
          badge: "QUESTION CLOSED",
          linkedRecordType: "Gap",
          linkedRecordId: gap.id,
          relatedRecordIds: gap.resolvedByInternalInputId ? [gap.resolvedByInternalInputId] : [],
          modalType: "gap",
        }),
      );
    }
  }

  for (const comparison of briefComparisons) {
    events.push(
      row(comparison.createdAt.toISOString(), {
        id: `brief-compare:${comparison.id}`,
        lane: "issue_record",
        title: "Compare brief versions",
        subtitle: `${comparison.mode} · ${comparison.changeCount} changes`,
        badge: "COMPARE",
        linkedRecordType: "BriefComparison",
        linkedRecordId: comparison.id,
        relatedRecordIds: [comparison.fromBriefVersionId, comparison.toBriefVersionId],
        modalType: "brief_comparison",
      }),
    );
  }

  for (const brief of briefVersions) {
    const label = briefBadge(brief.mode);
    events.push(
      row(brief.createdAt.toISOString(), {
        id: `brief:${brief.id}`,
        lane: "metis_output",
        title: `${label} v${brief.versionNumber}`,
        subtitle: brief.circulationState,
        badge: label,
        status: brief.circulationState,
        linkedRecordType: "BriefVersion",
        linkedRecordId: brief.id,
        modalType: "brief",
      }),
    );
  }

  for (const message of messageVariants) {
    const badge = templateBadge(message.templateId);
    events.push(
      row(message.createdAt.toISOString(), {
        id: `message:${message.id}`,
        lane: "metis_output",
        title: `${badge} v${message.versionNumber}`,
        subtitle: message.approvalStatus,
        badge,
        status: message.approvalStatus,
        linkedRecordType: "MessageVariant",
        linkedRecordId: message.id,
        modalType: "message",
      }),
    );
  }

  for (const exp of artifactExports) {
    events.push(
      row(exp.createdAt.toISOString(), {
        id: `export:${exp.id}`,
        lane: "metis_output",
        title: `${exp.format.toUpperCase()} export`,
        subtitle: exp.approvalStatus,
        badge: "EXPORT",
        status: exp.approvalStatus,
        linkedRecordType: "ArtifactExport",
        linkedRecordId: exp.id,
        modalType: "export",
      }),
    );
  }

  for (const circ of circulationEvents) {
    events.push(
      row(circ.createdAt.toISOString(), {
        id: `circulation:${circ.id}`,
        lane: "metis_output",
        title: circ.eventType.replace(/_/g, " "),
        subtitle: [circ.channel, circ.audienceLabel].filter(Boolean).join(" · ") || circ.postureState,
        badge: "CIRCULATION",
        linkedRecordType: "CirculationEvent",
        linkedRecordId: circ.id,
        relatedRecordIds: [circ.briefVersionId, ...(circ.exportId ? [circ.exportId] : [])],
        modalType: "circulation",
      }),
    );
  }

  const claimInputByClaimId = new Map<string, string>();
  for (const link of claimInternalLinks) {
    if (!claimInputByClaimId.has(link.claimId)) {
      claimInputByClaimId.set(link.claimId, link.internalInputId);
    }
  }

  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const groupedEvents = groupIssueHistoryRecordAdditions(events, { claimInputByClaimId }, row);
  const { events: cappedEvents, truncation } = capEvents(groupedEvents);
  endAssembly();

  const payload: IssueHistoryTimelinePayload = {
    issueId: issue.id,
    issueTitle: issue.title,
    controlledPositionHeadline: issue.summary.trim().slice(0, 120) || issue.title,
    controlledPositionDetail: [issue.status, issue.operatorPosture].filter(Boolean).join(" · "),
    events: cappedEvents,
    truncation,
  };

  issueHistoryPerfLog("serialization", {
    eventCount: payload.events.length,
    approxJsonBytes: JSON.stringify(payload).length,
    capped: truncation.capped,
    totalEvents: truncation.totalEvents,
  });

  endTotal();
  return payload;
}

function formatHistoryDetailTimestamp(iso: Date | string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Lazy-load modal/detail payload for one timeline card. */
export async function loadIssueHistoryEventDetail(
  issueId: string,
  card: Pick<IssueHistoryEventCard, "linkedRecordType" | "linkedRecordId" | "modalType" | "id">,
  viewer: IssueHistoryViewer,
  options?: { relatedRecordIds?: string[] },
): Promise<IssueHistoryModalPayload> {
  const end = issueHistoryPerfStart(`loadIssueHistoryEventDetail ${card.modalType}`);
  const registry = await loadIssueHistoryDisplayRegistry(issueId);
  const relatedRecords = resolveRelatedRecordIds(registry, options?.relatedRecordIds ?? []);

  let modal: IssueHistoryModalPayload;

  switch (card.linkedRecordType) {
    case "InternalInput": {
      const input = await prisma.internalInput.findFirst({
        where: {
          AND: [{ id: card.linkedRecordId }, prismaWhereInternalInputsVisibleToViewer(issueId, viewer)],
        },
        select: {
          id: true,
          name: true,
          role: true,
          response: true,
          confidence: true,
          createdAt: true,
          observationNumber: true,
        },
      });
      if (!input) {
        modal = { summary: "Update not found or not visible.", relatedRecords };
        break;
      }

      const [links, closedGaps] = await Promise.all([
        prisma.claimInternalInput.findMany({
          where: { internalInputId: input.id, claim: { issueId } },
          select: {
            claim: {
              select: {
                id: true,
                claimNumber: true,
                text: true,
                sources: {
                  select: { source: { select: { id: true, sourceCode: true, title: true } } },
                },
              },
            },
          },
        }),
        prisma.gap.findMany({
          where: { issueId, resolvedByInternalInputId: input.id },
          select: { id: true, gapNumber: true, title: true },
        }),
      ]);

      const impactClaims = links.map((l) => {
        const resolved = registry.resolve(l.claim.id);
        return (
          resolved ?? {
            id: l.claim.id,
            code: formatClaimCode(l.claim.claimNumber) ?? "CLM",
            label: truncate(l.claim.text, 80),
          }
        );
      });

      const impactClosed = closedGaps.map((g) => {
        const resolved = registry.resolve(g.id);
        return (
          resolved ?? {
            id: g.id,
            code: formatGapCode(g.gapNumber) ?? "Q",
            label: g.title,
          }
        );
      });

      const sourceMap = new Map<string, { id: string; code: string; label: string }>();
      for (const row of links) {
        for (const cs of row.claim.sources) {
          const resolved = registry.resolve(cs.source.id);
          if (resolved) {
            sourceMap.set(resolved.id, resolved);
          } else {
            sourceMap.set(cs.source.id, {
              id: cs.source.id,
              code: cs.source.sourceCode,
              label: cs.source.title,
            });
          }
        }
      }
      const impactSources = [...sourceMap.values()];

      const submitterMeta = {
        role: input.role.trim(),
        name: input.name.trim() || "Unknown",
        confidence: input.confidence.trim(),
        timestamp: input.createdAt.toISOString(),
        displayTime: formatHistoryDetailTimestamp(input.createdAt),
      };

      const isRecordUpdate = card.modalType === "issue_record_update";
      const changeParts: string[] = [];
      if (impactClaims.length) changeParts.push(`${impactClaims.length} claim(s) linked`);
      if (impactClosed.length) changeParts.push(`${impactClosed.length} question(s) closed`);
      if (impactSources.length) changeParts.push(`${impactSources.length} source(s) referenced`);

      modal = {
        summary: isRecordUpdate
          ? `Issue record updated from ${submitterMeta.name}.`
          : truncate(input.response, 160),
        submitterMeta,
        recordMeta: isRecordUpdate
          ? {
              recordType: "Issue record update",
              changeSummary: changeParts.join(" · ") || "Structured record updated",
              createdAt: formatHistoryDetailTimestamp(input.createdAt),
              href: `/issues/${issueId}/claims`,
            }
          : undefined,
        submittedUpdate: isRecordUpdate
          ? undefined
          : { heading: "Original submitted update", body: input.response },
        issueRecordImpact:
          impactClaims.length || impactClosed.length || impactSources.length
            ? {
                sources: impactSources.length ? impactSources : undefined,
                claims: impactClaims.length ? impactClaims : undefined,
                questionsClosed: impactClosed.length ? impactClosed : undefined,
              }
            : undefined,
        relatedRecords,
        fullRecordSections: isRecordUpdate
          ? [
              {
                heading: "What changed",
                body: changeParts.length ? changeParts.map((p) => `- ${p}`).join("\n") : "Issue record updated.",
              },
              ...(impactClaims.length
                ? [
                    {
                      heading: "Claims linked",
                      body: impactClaims.map((c) => `→ ${c.code}: ${c.label}`).join("\n"),
                    },
                  ]
                : []),
              ...(impactClosed.length
                ? [
                    {
                      heading: "Questions closed",
                      body: impactClosed.map((c) => `→ ${c.code}: ${c.label}`).join("\n"),
                    },
                  ]
                : []),
              ...(impactSources.length
                ? [
                    {
                      heading: "Sources referenced",
                      body: impactSources.map((s) => `→ ${s.code}: ${s.label}`).join("\n"),
                    },
                  ]
                : []),
              {
                heading: "Original submitted update",
                body: input.response,
              },
            ]
          : [
              { heading: "Original submitted update", body: input.response },
              ...(impactClaims.length || impactClosed.length || impactSources.length
                ? [
                    {
                      heading: "Metis issue record impact",
                      body: [
                        ...(impactSources.length
                          ? ["Sources:", ...impactSources.map((s) => `→ ${s.code}: ${s.label}`)]
                          : []),
                        ...(impactClaims.length
                          ? ["Claims linked:", ...impactClaims.map((c) => `→ ${c.code}: ${c.label}`)]
                          : []),
                        ...(impactClosed.length
                          ? ["Open questions closed:", ...impactClosed.map((c) => `→ ${c.code}: ${c.label}`)]
                          : []),
                      ].join("\n"),
                    },
                  ]
                : []),
            ],
      };
      break;
    }
    case "issue_record_update": {
      const inputId = card.linkedRecordId.replace(/::issue_record_update$/, "");
      modal = await loadIssueHistoryEventDetail(
        issueId,
        { ...card, linkedRecordType: "InternalInput", linkedRecordId: inputId, modalType: "issue_record_update" },
        viewer,
        options,
      );
      break;
    }
    case "Source": {
      const source = await prisma.source.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          id: true,
          sourceCode: true,
          title: true,
          note: true,
          snippet: true,
          tier: true,
          createdAt: true,
        },
      });
      const resolved = source ? registry.resolve(source.id) : null;
      const code = resolved?.code ?? source?.sourceCode ?? "SRC";
      modal = source
        ? {
            summary: truncate(source.note ?? source.title),
            recordMeta: {
              recordType: "Source",
              status: source.tier,
              createdAt: formatHistoryDetailTimestamp(source.createdAt),
              href: `/issues/${issueId}/sources`,
            },
            issueRecordImpact: {
              sources: [
                resolved ?? {
                  id: source.id,
                  code,
                  label: source.title,
                },
              ],
            },
            relatedRecords,
            fullRecordSections: [
              {
                heading: `${code} · ${source.title}`,
                body: [source.note, source.snippet].filter(Boolean).join("\n\n"),
              },
            ],
          }
        : { summary: "Source not found.", relatedRecords };
      break;
    }
    case "Claim": {
      const claim = await prisma.claim.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          id: true,
          claimNumber: true,
          text: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      const resolved = claim ? registry.resolve(claim.id) : null;
      const code = resolved?.code ?? (claim ? formatClaimCode(claim.claimNumber) ?? "CLM" : "CLM");
      modal = claim
        ? {
            summary: truncate(claim.text),
            recordMeta: {
              recordType: "Claim",
              status: claim.status,
              createdAt: formatHistoryDetailTimestamp(claim.createdAt),
              updatedAt:
                claim.updatedAt.getTime() > claim.createdAt.getTime() + 1000
                  ? formatHistoryDetailTimestamp(claim.updatedAt)
                  : undefined,
              href: `/issues/${issueId}/claims`,
            },
            issueRecordImpact: {
              claims: [
                resolved ?? {
                  id: claim.id,
                  code,
                  label: truncate(claim.text, 100),
                },
              ],
            },
            relatedRecords,
            fullRecordSections: [{ heading: code, body: claim.text }],
          }
        : { summary: "Claim not found.", relatedRecords };
      break;
    }
    case "Gap": {
      const gap = await prisma.gap.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          id: true,
          gapNumber: true,
          title: true,
          whyItMatters: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      const resolved = gap ? registry.resolve(gap.id) : null;
      const code = resolved?.code ?? (gap ? formatGapCode(gap.gapNumber) ?? "Q" : "Q");
      modal = gap
        ? {
            summary: truncate(gap.whyItMatters),
            recordMeta: {
              recordType: "Open question",
              status: gap.status,
              createdAt: formatHistoryDetailTimestamp(gap.createdAt),
              updatedAt:
                gap.updatedAt.getTime() > gap.createdAt.getTime() + 1000
                  ? formatHistoryDetailTimestamp(gap.updatedAt)
                  : undefined,
              href: `/issues/${issueId}/gaps`,
            },
            issueRecordImpact: {
              questionsOpened: [
                resolved ?? {
                  id: gap.id,
                  code,
                  label: gap.title,
                },
              ],
            },
            relatedRecords,
            fullRecordSections: [{ heading: `${code} · ${gap.title}`, body: gap.whyItMatters }],
          }
        : { summary: "Open question not found.", relatedRecords };
      break;
    }
    case "BriefComparison": {
      const comparison = await prisma.briefComparison.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          mode: true,
          changeCount: true,
          createdAt: true,
          fromBriefVersion: { select: { versionNumber: true, mode: true } },
          toBriefVersion: { select: { versionNumber: true, mode: true } },
        },
      });
      const fromLabel = comparison
        ? `${comparison.fromBriefVersion.mode} v${comparison.fromBriefVersion.versionNumber}`
        : "—";
      const toLabel = comparison
        ? `${comparison.toBriefVersion.mode} v${comparison.toBriefVersion.versionNumber}`
        : "—";
      modal = comparison
        ? {
            summary: `${comparison.changeCount} tracked changes between brief versions.`,
            recordMeta: {
              recordType: "Brief comparison",
              changeSummary: `${fromLabel} → ${toLabel}`,
              createdAt: formatHistoryDetailTimestamp(comparison.createdAt),
              href: `/issues/${issueId}/compare?mode=${comparison.mode}`,
            },
            relatedRecords,
            fullRecordSections: [
              {
                heading: "Brief comparison",
                body: `Mode: ${comparison.mode}\nFrom: ${fromLabel}\nTo: ${toLabel}\nChanges: ${comparison.changeCount}`,
              },
            ],
          }
        : { summary: "Comparison not found.", relatedRecords };
      break;
    }
    case "BriefVersion": {
      const brief = await prisma.briefVersion.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          mode: true,
          versionNumber: true,
          circulationState: true,
          generatedFromIssueUpdatedAt: true,
          createdAt: true,
          artifact: true,
        },
      });
      const label = brief ? briefBadge(brief.mode) : "Brief";
      const parsedArtifact = brief ? parseBriefArtifact(brief.artifact) : null;
      modal = brief
        ? {
            summary: `${label} version ${brief.versionNumber}`,
            outputMeta: {
              status: brief.circulationState,
              versionNumber: brief.versionNumber,
              generatedAt: formatHistoryDetailTimestamp(brief.generatedFromIssueUpdatedAt),
              href: `/issues/${issueId}/brief?mode=${brief.mode}`,
            },
            recordMeta: {
              recordType: label,
              status: brief.circulationState,
              createdAt: formatHistoryDetailTimestamp(brief.createdAt),
              href: `/issues/${issueId}/brief?mode=${brief.mode}`,
            },
            relatedRecords,
            fullRecordSections: parsedArtifact
              ? briefArtifactToRecordSections(parsedArtifact)
              : [
                  {
                    heading: label,
                    body: `Version ${brief.versionNumber}\nMode: ${brief.mode}\nCirculation: ${brief.circulationState}`,
                  },
                ],
          }
        : { summary: "Brief not found.", relatedRecords };
      break;
    }
    case "MessageVariant": {
      const message = await prisma.messageVariant.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          templateId: true,
          versionNumber: true,
          approvalStatus: true,
          generatedFromIssueUpdatedAt: true,
          createdAt: true,
          artifact: true,
        },
      });
      const badge = message ? templateBadge(message.templateId) : "Message";
      const parsedArtifact = message ? parseMessageArtifact(message.artifact) : null;
      const wording = parsedArtifact ? messageArtifactWording(parsedArtifact) : undefined;
      const guardrails = parsedArtifact ? messageArtifactGuardrails(parsedArtifact) : undefined;
      const primaryBody = parsedArtifact ? messageArtifactPrimaryBody(parsedArtifact) : "";
      modal = message
        ? {
            summary: `${badge} · version ${message.versionNumber}`,
            outputMeta: {
              audience: parsedArtifact?.metadata.audienceLabel,
              status: message.approvalStatus,
              versionNumber: message.versionNumber,
              templateLabel: parsedArtifact
                ? messageTemplateDisplayName(parsedArtifact.templateId)
                : message.templateId,
              generatedAt: formatHistoryDetailTimestamp(message.generatedFromIssueUpdatedAt),
              href: `/issues/${issueId}/messages`,
            },
            messageWording: wording,
            guardrails,
            relatedRecords,
            fullRecordSections: parsedArtifact
              ? messageArtifactRecordSections(parsedArtifact)
              : [
                  {
                    heading: badge,
                    body: primaryBody || `Version ${message.versionNumber}\nStatus: ${message.approvalStatus}`,
                  },
                ],
          }
        : { summary: "Message not found.", relatedRecords };
      break;
    }
    case "ArtifactExport": {
      const exp = await prisma.artifactExport.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          filename: true,
          approvalStatus: true,
          format: true,
          createdAt: true,
        },
      });
      modal = exp
        ? {
            summary: exp.filename,
            outputMeta: {
              status: exp.approvalStatus,
              href: `/issues/${issueId}/export`,
            },
            recordMeta: {
              recordType: "Export",
              status: `${exp.format.toUpperCase()} · ${exp.approvalStatus}`,
              createdAt: formatHistoryDetailTimestamp(exp.createdAt),
              href: `/issues/${issueId}/export`,
            },
            relatedRecords,
            fullRecordSections: [
              {
                heading: `${exp.format.toUpperCase()} export`,
                body: `${exp.filename}\nStatus: ${exp.approvalStatus}`,
              },
            ],
          }
        : { summary: "Export not found.", relatedRecords };
      break;
    }
    case "CirculationEvent": {
      const circ = await prisma.circulationEvent.findFirst({
        where: { id: card.linkedRecordId, issueId },
        select: {
          eventType: true,
          channel: true,
          audienceLabel: true,
          postureState: true,
          note: true,
          createdAt: true,
        },
      });
      modal = circ
        ? {
            summary: circ.note ?? circ.eventType.replace(/_/g, " "),
            recordMeta: {
              recordType: "Circulation",
              changeSummary: [circ.audienceLabel, circ.channel].filter(Boolean).join(" · "),
              createdAt: formatHistoryDetailTimestamp(circ.createdAt),
            },
            relatedRecords,
            fullRecordSections: [
              {
                heading: "Circulation event",
                body: [
                  `Event: ${circ.eventType.replace(/_/g, " ")}`,
                  circ.audienceLabel ? `Audience: ${circ.audienceLabel}` : null,
                  circ.channel ? `Channel: ${circ.channel}` : null,
                  circ.postureState ? `Posture: ${circ.postureState}` : null,
                  circ.note ? `\n${circ.note}` : null,
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
            ],
          }
        : { summary: "Circulation event not found.", relatedRecords };
      break;
    }
    case "records_added_group": {
      const recordIds = options?.relatedRecordIds?.length
        ? options.relatedRecordIds
        : card.relatedRecordIds ?? [];

      const [sources, claims, gaps] = await Promise.all([
        prisma.source.findMany({
          where: { issueId, id: { in: recordIds } },
          select: {
            id: true,
            sourceCode: true,
            title: true,
            note: true,
            tier: true,
            createdAt: true,
          },
        }),
        prisma.claim.findMany({
          where: { issueId, id: { in: recordIds } },
          select: {
            id: true,
            claimNumber: true,
            text: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.gap.findMany({
          where: { issueId, id: { in: recordIds } },
          select: {
            id: true,
            gapNumber: true,
            title: true,
            whyItMatters: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      const impactSources = sources.map((source) => {
        const resolved = registry.resolve(source.id);
        return (
          resolved ?? {
            id: source.id,
            code: source.sourceCode,
            label: source.title,
          }
        );
      });

      const impactClaims = claims.map((claim) => {
        const resolved = registry.resolve(claim.id);
        const code = resolved?.code ?? formatClaimCode(claim.claimNumber) ?? "CLM";
        return (
          resolved ?? {
            id: claim.id,
            code,
            label: truncate(claim.text, 100),
          }
        );
      });

      const impactQuestions = gaps.map((gap) => {
        const resolved = registry.resolve(gap.id);
        const code = resolved?.code ?? formatGapCode(gap.gapNumber) ?? "Q";
        return (
          resolved ?? {
            id: gap.id,
            code,
            label: gap.title,
          }
        );
      });

      const total = impactSources.length + impactClaims.length + impactQuestions.length;
      const summaryParts: string[] = [];
      if (impactSources.length) summaryParts.push(`${impactSources.length} source(s)`);
      if (impactClaims.length) summaryParts.push(`${impactClaims.length} claim(s)`);
      if (impactQuestions.length) summaryParts.push(`${impactQuestions.length} open question(s)`);

      const fullRecordSections: { heading: string; body: string }[] = [];
      if (impactSources.length) {
        fullRecordSections.push({
          heading: "Sources",
          body: sources
            .map((s) => {
              const code = registry.resolve(s.id)?.code ?? s.sourceCode;
              return `→ ${code}: ${s.title}${s.note ? `\n  ${truncate(s.note, 200)}` : ""}`;
            })
            .join("\n\n"),
        });
      }
      if (impactClaims.length) {
        fullRecordSections.push({
          heading: "Claims",
          body: claims
            .map((c) => {
              const code = registry.resolve(c.id)?.code ?? formatClaimCode(c.claimNumber) ?? "CLM";
              return `→ ${code}: ${truncate(c.text, 200)} (${c.status})`;
            })
            .join("\n\n"),
        });
      }
      if (impactQuestions.length) {
        fullRecordSections.push({
          heading: "Open questions",
          body: gaps
            .map((g) => {
              const code = registry.resolve(g.id)?.code ?? formatGapCode(g.gapNumber) ?? "Q";
              return `→ ${code}: ${g.title}${g.whyItMatters ? `\n  ${truncate(g.whyItMatters, 200)}` : ""}`;
            })
            .join("\n\n"),
        });
      }

      const earliestCreated = [...sources, ...claims, ...gaps]
        .map((r) => r.createdAt)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      modal = {
        summary:
          total > 0
            ? `${total} record(s) added: ${summaryParts.join(", ")}.`
            : "Grouped record addition.",
        recordMeta: earliestCreated
          ? {
              recordType: "Records added",
              changeSummary: summaryParts.join(" · "),
              createdAt: formatHistoryDetailTimestamp(earliestCreated),
              href: `/issues/${issueId}/claims`,
            }
          : undefined,
        issueRecordImpact: {
          sources: impactSources.length ? impactSources : undefined,
          claims: impactClaims.length ? impactClaims : undefined,
          questionsOpened: impactQuestions.length ? impactQuestions : undefined,
        },
        relatedRecords,
        fullRecordSections,
      };
      break;
    }
    default:
      modal = { summary: "Detail not available for this card type.", relatedRecords };
  }

  end();
  return modal;
}

/** @deprecated Use buildIssueHistoryTimeline */
export async function buildIssueHistoryProjection(
  issueId: string,
  viewer: IssueHistoryViewer,
): Promise<IssueHistoryTimelinePayload> {
  return buildIssueHistoryTimeline(issueId, viewer);
}
