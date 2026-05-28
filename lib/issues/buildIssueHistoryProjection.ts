import { prisma } from "@/lib/db/prisma";
import { formatClaimCode, formatGapCode } from "@/lib/issueRecordCodes";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";

import { formatIssueHistoryAxisTime } from "./issueHistoryTime";
import type {
  IssueHistoryEvent,
  IssueHistoryImpactRecord,
  IssueHistoryImpactSummary,
  IssueHistoryProjection,
} from "./issueHistoryTypes";

export type IssueHistoryViewer = {
  membershipRole: string;
  userId: string;
};

function row(
  timestamp: string,
  partial: Omit<IssueHistoryEvent, "timestamp" | "displayTime" | "day" | "time">,
): IssueHistoryEvent {
  const axis = formatIssueHistoryAxisTime(timestamp);
  return {
    timestamp,
    displayTime: axis.displayTime,
    day: axis.day,
    time: axis.time,
    ...partial,
  };
}

function impactRecord(id: string, code: string, label: string): IssueHistoryImpactRecord {
  return { id, code, label };
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

function briefBadge(mode: string): string {
  return mode === "executive" ? "EXECUTIVE BRIEF" : "FULL BRIEF";
}

function truncateSummary(text: string, max = 140): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function buildIssueHistoryProjection(
  issueId: string,
  viewer: IssueHistoryViewer,
): Promise<IssueHistoryProjection> {
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
    prisma.issue.findUniqueOrThrow({
      where: { id: issueId },
      select: { id: true, title: true, summary: true, status: true, operatorPosture: true },
    }),
    prisma.internalInput.findMany({
      where: prismaWhereInternalInputsVisibleToViewer(issueId, viewer),
      orderBy: { createdAt: "asc" },
    }),
    prisma.source.findMany({ where: { issueId }, orderBy: { createdAt: "asc" } }),
    prisma.claim.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      include: { internalLinks: { select: { internalInputId: true } } },
    }),
    prisma.gap.findMany({ where: { issueId }, orderBy: { createdAt: "asc" } }),
    prisma.briefVersion.findMany({ where: { issueId }, orderBy: { createdAt: "asc" } }),
    prisma.messageVariant.findMany({ where: { issueId }, orderBy: { createdAt: "asc" } }),
    prisma.artifactExport.findMany({ where: { issueId }, orderBy: { createdAt: "asc" } }),
    prisma.circulationEvent.findMany({ where: { issueId }, orderBy: { createdAt: "asc" } }),
    prisma.briefComparison.findMany({ where: { issueId }, orderBy: { createdAt: "asc" } }),
    prisma.claimInternalInput.findMany({
      where: { claim: { issueId } },
      select: { claimId: true, internalInputId: true },
    }),
  ]);

  const claimsByInput = new Map<string, typeof claims>();
  for (const link of claimInternalLinks) {
    const claim = claims.find((c) => c.id === link.claimId);
    if (!claim) continue;
    const list = claimsByInput.get(link.internalInputId) ?? [];
    list.push(claim);
    claimsByInput.set(link.internalInputId, list);
  }

  const events: IssueHistoryEvent[] = [];

  for (const input of internalInputs) {
    const linkedClaims = claimsByInput.get(input.id) ?? [];
    const closedGaps = gaps.filter((g) => g.resolvedByInternalInputId === input.id);
    const impactClaims = linkedClaims.map((c) =>
      impactRecord(c.id, formatClaimCode(c.claimNumber) ?? "CLM", truncateSummary(c.text, 80)),
    );
    const impactClosed = closedGaps.map((g) =>
      impactRecord(g.id, formatGapCode(g.gapNumber) ?? "Q", g.title),
    );

    const impactSummary: IssueHistoryImpactSummary = {};
    if (impactClaims.length) impactSummary.claimsAdded = impactClaims.length;
    if (impactClosed.length) impactSummary.questionsClosed = impactClosed.length;

    const hasImpact = impactClaims.length > 0 || impactClosed.length > 0;

    events.push(
      row(input.createdAt.toISOString(), {
        id: `incoming:${input.id}`,
        lane: "incoming_update",
        title: input.name.trim() || "Update received",
        subtitle: `${input.role.trim()} · ${input.confidence}`,
        badge: input.role.trim().toUpperCase() || "UPDATE",
        linkedRecordType: "InternalInput",
        linkedRecordId: input.id,
        relatedRecordIds: [
          ...linkedClaims.map((c) => c.id),
          ...closedGaps.map((g) => g.id),
        ],
        modalType: "incoming_update",
        impactSummary: hasImpact ? impactSummary : undefined,
        impactChips: hasImpact ? chipsFromImpact(impactSummary) : undefined,
        modal: {
          summary: truncateSummary(input.response),
          submittedUpdate: {
            heading: "Original submitted update",
            body: input.response,
          },
          issueRecordImpact: hasImpact
            ? {
                claims: impactClaims.length ? impactClaims : undefined,
                questionsClosed: impactClosed.length ? impactClosed : undefined,
              }
            : undefined,
          fullRecordSections: [
            { heading: "Original submitted update", body: input.response },
            ...(hasImpact
              ? [
                  {
                    heading: "Metis issue record impact",
                    body: [
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
        },
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
          relatedRecordIds: [
            input.id,
            ...linkedClaims.map((c) => c.id),
            ...closedGaps.map((g) => g.id),
          ],
          modalType: "issue_record_update",
          impactSummary,
          impactChips: chipsFromImpact(impactSummary),
          modal: {
            summary: impactSubtitle,
            issueRecordImpact: {
              claims: impactClaims.length ? impactClaims : undefined,
              questionsClosed: impactClosed.length ? impactClosed : undefined,
            },
            fullRecordSections: [
              {
                heading: "Metis issue record impact",
                body: [
                  ...(impactClaims.length
                    ? ["Claims added or linked:", ...impactClaims.map((c) => `→ ${c.code}: ${c.label}`)]
                    : []),
                  ...(impactClosed.length
                    ? ["Open questions closed:", ...impactClosed.map((c) => `→ ${c.code}: ${c.label}`)]
                    : []),
                ].join("\n"),
              },
            ],
          },
        }),
      );
    }
  }

  for (const source of sources) {
    const code = source.sourceCode;
    events.push(
      row(source.createdAt.toISOString(), {
        id: `source:${source.id}`,
        lane: "issue_record",
        title: source.title,
        subtitle: `${code} · ${source.tier}`,
        badge: "SOURCE LINKED",
        linkedRecordType: "Source",
        linkedRecordId: source.id,
        modalType: "source",
        modal: {
          summary: truncateSummary(source.note ?? source.title),
          issueRecordImpact: {
            sources: [impactRecord(source.id, code, source.title)],
          },
          fullRecordSections: [
            {
              heading: "Source record",
              body: [source.title, source.note, source.snippet].filter(Boolean).join("\n\n"),
            },
          ],
        },
      }),
    );
  }

  for (const claim of claims) {
    const code = formatClaimCode(claim.claimNumber) ?? "CLM";
    events.push(
      row(claim.createdAt.toISOString(), {
        id: `claim:${claim.id}`,
        lane: "issue_record",
        title: truncateSummary(claim.text, 72),
        subtitle: `${code} · ${claim.status}`,
        badge: "CLAIM ADDED",
        linkedRecordType: "Claim",
        linkedRecordId: claim.id,
        relatedRecordIds: claim.internalLinks.map((l) => l.internalInputId),
        modalType: "claim",
        modal: {
          summary: truncateSummary(claim.text),
          issueRecordImpact: {
            claims: [impactRecord(claim.id, code, claim.text)],
          },
          fullRecordSections: [{ heading: code, body: claim.text }],
        },
      }),
    );

    const updatedMs = claim.updatedAt.getTime() - claim.createdAt.getTime();
    if (updatedMs > 2000) {
      events.push(
        row(claim.updatedAt.toISOString(), {
          id: `claim-updated:${claim.id}:${claim.updatedAt.toISOString()}`,
          lane: "issue_record",
          title: `${code} updated`,
          subtitle: claim.status,
          badge: "CLAIM UPDATED",
          linkedRecordType: "Claim",
          linkedRecordId: claim.id,
          modalType: "claim",
          modal: {
            summary: `Claim status: ${claim.status}`,
            issueRecordImpact: {
              claims: [impactRecord(claim.id, code, claim.text)],
            },
            fullRecordSections: [{ heading: code, body: claim.text }],
          },
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
        modal: {
          summary: truncateSummary(gap.whyItMatters),
          issueRecordImpact: {
            questionsOpened: [impactRecord(gap.id, code, gap.title)],
          },
          fullRecordSections: [
            { heading: code, body: `${gap.title}\n\n${gap.whyItMatters}` },
          ],
        },
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
          modal: {
            summary: gap.title,
            issueRecordImpact: {
              questionsClosed: [impactRecord(gap.id, code, gap.title)],
            },
            fullRecordSections: [{ heading: code, body: gap.title }],
          },
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
        modal: {
          summary: `${comparison.changeCount} tracked changes between brief versions.`,
          fullRecordSections: [
            {
              heading: "Brief comparison",
              body: `Mode: ${comparison.mode}\nChanges: ${comparison.changeCount}`,
            },
          ],
        },
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
        modal: {
          summary: `${label} version ${brief.versionNumber}`,
          outputMeta: {
            status: brief.circulationState,
            versionNumber: brief.versionNumber,
            href: `/issues/${issueId}/brief?mode=${brief.mode}`,
          },
          fullRecordSections: [
            {
              heading: label,
              body: `Version ${brief.versionNumber}\nCirculation: ${brief.circulationState}`,
            },
          ],
        },
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
        modal: {
          summary: `${badge} · version ${message.versionNumber}`,
          outputMeta: {
            status: message.approvalStatus,
            versionNumber: message.versionNumber,
            href: `/issues/${issueId}/messages`,
          },
          fullRecordSections: [
            {
              heading: badge,
              body: `Template: ${message.templateId}\nVersion: ${message.versionNumber}\nStatus: ${message.approvalStatus}`,
            },
          ],
        },
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
        modal: {
          summary: exp.filename,
          outputMeta: {
            status: exp.approvalStatus,
            href: `/issues/${issueId}/export`,
          },
          fullRecordSections: [{ heading: "Export", body: exp.filename }],
        },
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
        modal: {
          summary: circ.note ?? circ.eventType,
          fullRecordSections: [
            {
              heading: "Circulation",
              body: [
                circ.eventType,
                circ.channel,
                circ.audienceLabel,
                circ.postureState,
                circ.note,
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        },
      }),
    );
  }

  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const controlledPositionHeadline =
    issue.summary.trim().slice(0, 120) || issue.title;
  const controlledPositionDetail = [issue.status, issue.operatorPosture].filter(Boolean).join(" · ");

  return {
    issueId: issue.id,
    issueTitle: issue.title,
    controlledPositionHeadline,
    controlledPositionDetail,
    events,
  };
}
