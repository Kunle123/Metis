import type { GapSeverity } from "@metis/shared/gap";

export type IssueAttentionItemTone = "critical" | "warning" | "info" | "success";

/** Row returned when there is nothing substantive to review (card empty state helper). */
export type IssueAttentionItem = {
  id: string;
  tone: IssueAttentionItemTone;
  title: string;
  description: string;
  /** Absolute or rooted path (typically `/issues/{id}/...`). */
  href: string;
  linkLabel: string;
};

export type IssueAttentionGapInput = {
  status: string;
  severity: string;
};

export type IssueAttentionBriefFacetInput = {
  hasStored: boolean;
  needsRefresh: boolean;
};

export type IssueAttentionClaimAlignmentFacet = {
  hasCriticalFindings: boolean;
  /** Non-critical findings grouped for copy (informational + warnings). */
  hasNonCriticalFindings: boolean;
};

export type IssueAttentionBuilderInput = {
  /** Prefix like `/issues/{uuid}` — no trailing slash. */
  issueRoutePrefix: string;
  gaps: IssueAttentionGapInput[];
  /** Count of Confirmed-needing-validation style claims (`NeedsValidation` status). */
  needsValidationClaimsCount: number;
  /** Count of assumptions on the issue register (informational tone when highlighted). */
  assumptionClaimsCount: number;
  brief: {
    full: IssueAttentionBriefFacetInput;
    executive: IssueAttentionBriefFacetInput;
  };
  /** True when any latest saved draft (per template + audience lens) is out of sync. */
  anyMessageDraftStale: boolean;
  /**
   * When at least one saved draft exists — aggregate alignment across evaluated drafts.
   * Omit/null when nothing could be evaluated.
   */
  messageClaimAlignment: IssueAttentionClaimAlignmentFacet | null;
  /** True when there is at least one saved message variant anywhere on the issue and any latest row is Draft or InReview. */
  latestMessageVariantsNeedCoordination: boolean;
  /** True when the most recent ArtifactExport exists and is Draft or InReview. */
  latestExportNeedsCoordination: boolean;
  /** True when viewer may be told restricted observations exist (no counts or payloads). */
  showRestrictedObservationInfo?: boolean;
};

function isGapOpen(status: string) {
  return String(status ?? "").trim() === "Open";
}

function severityIsCritical(raw: string): raw is GapSeverity {
  return String(raw ?? "").trim() === "Critical";
}

function plural(n: number, singular: string, pluralForm: string) {
  const label = n === 1 ? singular : pluralForm;
  return `${n} ${label}`;
}

export function approvalCoordinationNeedsAttention(status: string | null | undefined): boolean {
  const s = String(status ?? "").trim();
  return s === "Draft" || s === "InReview";
}

/**
 * Builds an ordered checklist of coordination / review hints for an issue workspace.
 * Deterministic — pass precomputed staleness flags and counts from loaders.
 */
export function buildIssueAttentionSummary(input: IssueAttentionBuilderInput): IssueAttentionItem[] {
  const p = input.issueRoutePrefix.replace(/\/$/, "");
  const items: IssueAttentionItem[] = [];

  const openGaps = input.gaps.filter((g) => isGapOpen(g.status));
  if (openGaps.length > 0) {
    const anyCriticalOpen = openGaps.some((g) => severityIsCritical(g.severity));
    items.push({
      id: "open_questions",
      tone: anyCriticalOpen ? "critical" : "warning",
      title: plural(openGaps.length, "open question remains", "open questions remain"),
      description: anyCriticalOpen
        ? "Some unresolved questions are marked critical — clarify them before tightening outputs."
        : "Unresolved gaps can affect briefing confidence and stakeholder messaging.",
      href: `${p}/gaps`,
      linkLabel: "Review open questions →",
    });
  }

  if (input.needsValidationClaimsCount > 0) {
    items.push({
      id: "claims_validation",
      tone: "warning",
      title: plural(input.needsValidationClaimsCount, "claim needs validation", "claims need validation"),
      description: "Confirm wording, sourcing, or status before circulating.",
      href: `${p}/claims`,
      linkLabel: "Review claims →",
    });
  } else if (input.assumptionClaimsCount > 0) {
    items.push({
      id: "claims_assumptions",
      tone: "info",
      title: plural(input.assumptionClaimsCount, "working assumption tracked", "working assumptions tracked"),
      description: "Assumptions are expected — keep them labelled as such in outputs.",
      href: `${p}/claims`,
      linkLabel: "Review claims →",
    });
  }

  if (input.brief.full.hasStored && input.brief.full.needsRefresh) {
    items.push({
      id: "brief_full_refresh",
      tone: "warning",
      title: "Full brief needs refresh",
      description: "The stored full brief looks out of sync with the current issue snapshot.",
      href: `${p}/brief?mode=full`,
      linkLabel: "Refresh brief →",
    });
  }

  if (input.brief.executive.hasStored && input.brief.executive.needsRefresh) {
    items.push({
      id: "brief_exec_refresh",
      tone: "warning",
      title: "Executive brief needs refresh",
      description: "The stored executive brief looks out of sync with the current issue snapshot.",
      href: `${p}/brief?mode=executive`,
      linkLabel: "Refresh brief →",
    });
  }

  if (input.anyMessageDraftStale) {
    items.push({
      id: "message_draft_refresh",
      tone: "warning",
      title: "Saved message draft needs refresh",
      description:
        "At least one saved draft no longer reflects the latest issue inputs — regenerate or revise before circulating.",
      href: `${p}/messages`,
      linkLabel: "Review message draft →",
    });
  }

  if (input.messageClaimAlignment) {
    const { hasCriticalFindings, hasNonCriticalFindings } = input.messageClaimAlignment;
    if (hasCriticalFindings) {
      items.push({
        id: "claim_alignment_critical",
        tone: "critical",
        title: "Claim alignment issues found",
        description:
          "A saved draft may state claims inconsistently — review wording against the Claim register.",
        href: `${p}/messages`,
        linkLabel: "Review message draft →",
      });
    } else if (hasNonCriticalFindings) {
      items.push({
        id: "claim_alignment_warning",
        tone: "warning",
        title: "Claim alignment warnings found",
        description: "A saved draft triggers alignment checks worth skimming before sign-off.",
        href: `${p}/messages`,
        linkLabel: "Review message draft →",
      });
    }
  }

  if (input.latestMessageVariantsNeedCoordination) {
    items.push({
      id: "message_approval_coordination",
      tone: "info",
      title: "Message draft approval not complete yet",
      description: "At least one saved draft is still in Draft or awaiting review coordination.",
      href: `${p}/messages`,
      linkLabel: "Review message draft →",
    });
  }

  if (input.latestExportNeedsCoordination) {
    items.push({
      id: "export_coordination",
      tone: "info",
      title: "Latest export package still in coordination",
      description: "The most recent packaged export remains in Draft or under review.",
      href: `${p}/export`,
      linkLabel: "Review export package →",
    });
  }

  if (input.showRestrictedObservationInfo) {
    items.push({
      id: "restricted_observations",
      tone: "info",
      title: "Some observations are restricted",
      description:
        "Visibility is limited — ensure the right reviewers see internal notes without sharing details unnecessarily.",
      href: `${p}/input`,
      linkLabel: "Review observations →",
    });
  }

  return items;
}
