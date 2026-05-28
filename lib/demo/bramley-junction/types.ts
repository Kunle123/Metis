export type BramleyInputType =
  | "OPS PLAN"
  | "WORKS UPDATE"
  | "CONTRACTOR NOTE"
  | "STATION MANAGER"
  | "SECURITY UPDATE"
  | "NETWORK OPS"
  | "CUSTOMER TEAM"
  | "DUTY SUMMARY"
  | "COMMS INTAKE"
  | "SOCIAL SIGNAL"
  | "PRESS CALL"
  | "EXEC REQUEST"
  | "STATION UPDATE"
  | "FACILITIES NOTE"
  | "ACCESSIBILITY NOTE"
  | "OPS CONFIRMATION"
  | "EXEC ACTION";

export type BramleyIntakeRoute = "direct_to_comms" | "reconstructed_from_operational_source";

export type BramleyIncomingUpdate = {
  id: string;
  /** Operational event time described in the update (modal / narrative — not timeline axis). */
  eventOccurredAt: string;
  /** Timestamp on the original log, notice or update. */
  sourceTimestamp: string;
  /** When corporate affairs / comms became aware; null only for pre-engagement ops material. */
  receivedByCommsAt: string | null;
  /** When this row was entered into the Metis issue record. */
  addedToMetisAt: string;
  intakeRoute: BramleyIntakeRoute;
  inputType: BramleyInputType;
  senderTeam: string;
  channel: string;
  title: string;
  summary: string;
  fullText: string;
  suggestedTimelineLabel: string;
  becomesSource: boolean;
  linkedSourceId: string | null;
  issueRecordImpacts: {
    claimsAdded?: string[];
    gapsOpened?: string[];
    gapsClosed?: string[];
    observationsAdded?: string[];
    statusNote?: string;
  };
};

export type BramleySourceExport = {
  id: string;
  sourceCode: string;
  title: string;
  tier: string;
  reliability: string | null;
  note: string | null;
  snippet: string | null;
  timestampLabel: string | null;
  linkedIncomingUpdateId: string;
  /** When the source was linked in Metis (usually matches linked input `addedToMetisAt`). */
  addedToMetisAt: string;
  /** Original operational/source event time for chronology. */
  eventOccurredAt: string;
};

export type BramleyClaimExport = {
  id: string;
  claimCode: string;
  text: string;
  status: string;
  notes: string | null;
  linkedSourceIds: string[];
  linkedIncomingUpdateIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type BramleyOpenQuestionExport = {
  id: string;
  gapCode: string;
  title: string;
  prompt: string;
  whyItMatters: string;
  stakeholder: string;
  severity: string;
  /** Demo export may use `Partially answered` between first answer and full resolution. */
  status: string;
  /** When a working answer exists but the question is not fully closed (e.g. ~08:00 estimate). */
  partiallyAnsweredAt: string | null;
  resolvedAt: string | null;
  resolvedByIncomingUpdateId: string | null;
  resolutionNote: string | null;
  linkedClaimIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type BramleyObservationExport = {
  id: string;
  observationCode: string;
  title: string;
  body: string;
  confidence: string;
  authorRole: string;
  authorName: string;
  timestampLabel: string | null;
  createdAt: string;
};

export type BramleyOutputKind =
  | "staff_holding_update"
  | "passenger_message"
  | "social_response_line"
  | "holding_press_line"
  | "executive_brief"
  | "stakeholder_note"
  | "post_incident_review"
  | "circulation_audit";

export type BramleyOutputExport = {
  id: string;
  kind: BramleyOutputKind;
  title: string;
  audience: string;
  /** Intended use / purpose of the output (for governed modal display). */
  intendedUse?: string;
  status: string;
  versionNumber: number | null;
  generatedAt: string;
  basedOnSnapshotAt: string;
  includedRecordIds: string[];
  notYetKnownRecordIds: string[];
  openQuestionsAtGeneration: string[];
  caveatsAtGeneration: string[];
  supersededBy: string | null;
  linkedSourceIds: string[];
  linkedClaimIds: string[];
  body: string;
  doNotSay: string[];
  metisMessageVariantId: string | null;
  metisBriefVersionId: string | null;
  templateId: string | null;
  /** Optional: full Metis-style brief artifact for modals. */
  briefArtifact?: unknown;
  /** Optional: full MessageVariant artifact for modals. */
  messageArtifact?: unknown;
  /** Optional: Controlled draft body (pre-polish). */
  draftBody?: string;
  /** Optional: AI-polished wording body (second pass). */
  aiPolishedBody?: string;
  /** Which wording mode the modal should default to. */
  wordingModeDefault?: "controlled_draft" | "ai_polished";
  /** AI polish metadata for external demo modal. */
  aiPolish?: {
    enabled: boolean;
    preparedAt: string;
    label: string;
    summary: string;
    preservedConstraints: string[];
    changed: string[];
  };
};

export type BramleyCirculationExport = {
  id: string;
  at: string;
  eventType: string;
  channel: string | null;
  audienceLabel: string | null;
  postureState: string;
  note: string | null;
  briefVersionId: string | null;
  outputId: string | null;
};

export type BramleyIssueExport = {
  id: string;
  slug: string;
  /**
   * This export object is the final/current issue summary after the incident window — not the
   * point-in-time issue state used for earlier timeline cards or outputs.
   */
  exportKind: "final_current_state";
  asOf: string;
  exportNote: string;
  title: string;
  summary: string;
  issueType: string;
  severity: string;
  status: string;
  priority: string;
  operatorPosture: string;
  ownerName: string | null;
  audience: string | null;
  currentControlledPosition: string;
  confirmedFacts: string | null;
  context: string | null;
  statusMilestones: Array<{ at: string; label: string }>;
};

export type BramleyTimelineLane = "incoming_update" | "issue_record" | "metis_output";

/** Modal / detail metadata for incoming-update timeline rows. */
export type BramleyTimelineIntakeMeta = {
  /** Operational event described in the submitted update (not the timeline axis time). */
  reportedEventAt: string;
  sourceTimestamp: string;
  receivedByCommsAt: string | null;
  addedToMetisAt: string;
  intakeRoute: BramleyIntakeRoute;
};

export type BramleyTimelineImpactMeta = {
  linkedSourceId: string | null;
  claimsAdded: string[];
  gapsOpened: string[];
  gapsClosed: string[];
  observationsAdded: string[];
  statusNote: string | null;
};

/** Derived projection for the external timeline demo — not source of truth. */
export type BramleyTimelineItem = {
  /**
   * Primary sort/display time on the timeline axis.
   * Incoming reconstructed rows use `addedToMetisAt`; issue-record rows use Metis
   * creation/link times; outputs use `generatedAt`.
   */
  timestamp: string;
  /** Human-readable label for `timestamp` (Europe/London). */
  displayTime: string;
  lane: BramleyTimelineLane;
  title: string;
  subtitle: string;
  badge: string;
  linkedRecordType: string;
  linkedRecordId: string;
  relatedRecordIds: string[];
  /** Present on incoming-update rows for external demo modals (includes operational times). */
  intake?: BramleyTimelineIntakeMeta;
  /** Present on issue-record update rows for external demo modals. */
  impact?: BramleyTimelineImpactMeta;
};

export type BramleyDataset = {
  issue: BramleyIssueExport;
  incomingUpdates: BramleyIncomingUpdate[];
  sources: BramleySourceExport[];
  claims: BramleyClaimExport[];
  openQuestions: BramleyOpenQuestionExport[];
  observations: BramleyObservationExport[];
  outputs: BramleyOutputExport[];
  circulationEvents: BramleyCirculationExport[];
  timelineProjection: BramleyTimelineItem[];
};
