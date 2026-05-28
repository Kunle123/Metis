export type NorthbankInputType =
  | "PRODUCT UPDATE"
  | "COMMS INTAKE"
  | "PRICING UPDATE"
  | "COMPLIANCE NOTE"
  | "LEGAL NOTE"
  | "CUSTOMER OPS"
  | "ACCESSIBILITY REVIEW"
  | "DIGITAL READINESS"
  | "EXEC REQUEST"
  | "PARTNER UPDATE"
  | "MEDIA ENQUIRY"
  | "DIGITAL APPROVAL"
  | "PRICING APPROVAL"
  | "GO NO-GO"
  | "EXEC ACTION";

export type NorthbankIntakeRoute = "direct_to_comms" | "reconstructed_from_project_source";

export type NorthbankIncomingUpdate = {
  id: string;
  eventOccurredAt: string;
  sourceTimestamp: string;
  receivedByCommsAt: string | null;
  addedToMetisAt: string;
  intakeRoute: NorthbankIntakeRoute;
  inputType: NorthbankInputType;
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

export type NorthbankSourceExport = {
  id: string;
  sourceCode: string;
  title: string;
  tier: string;
  reliability: string | null;
  note: string | null;
  snippet: string | null;
  timestampLabel: string | null;
  linkedIncomingUpdateId: string;
  addedToMetisAt: string;
  eventOccurredAt: string;
};

export type NorthbankClaimExport = {
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

export type NorthbankOpenQuestionExport = {
  id: string;
  gapCode: string;
  title: string;
  prompt: string;
  whyItMatters: string;
  stakeholder: string;
  severity: string;
  status: string;
  partiallyAnsweredAt: string | null;
  resolvedAt: string | null;
  resolvedByIncomingUpdateId: string | null;
  resolutionNote: string | null;
  linkedClaimIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type NorthbankObservationExport = {
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

export type NorthbankOutputKind =
  | "staff_holding_update"
  | "passenger_message"
  | "holding_press_line"
  | "executive_brief"
  | "stakeholder_note"
  | "circulation_audit";

export type NorthbankOutputExport = {
  id: string;
  kind: NorthbankOutputKind;
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
};

export type NorthbankCirculationExport = {
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

export type NorthbankIssueExport = {
  id: string;
  slug: string;
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

export type NorthbankTimelineLane = "incoming_update" | "issue_record" | "metis_output";

export type NorthbankTimelineIntakeMeta = {
  eventOccurredAt: string;
  sourceTimestamp: string;
  receivedByCommsAt: string | null;
  addedToMetisAt: string;
  intakeRoute: NorthbankIntakeRoute;
};

export type NorthbankTimelineImpactMeta = {
  linkedSourceId: string | null;
  claimsAdded: string[];
  gapsOpened: string[];
  gapsClosed: string[];
  observationsAdded: string[];
  statusNote: string | null;
};

export type NorthbankTimelineItem = {
  /**
   * Primary sort/display time on the timeline axis.
   * Incoming reconstructed rows use `addedToMetisAt`; direct rows use `receivedByCommsAt`
   * (or `addedToMetisAt`); issue-record rows use Metis record times; outputs use `generatedAt`.
   */
  timestamp: string;
  /** Human-readable label for `timestamp` (Europe/London). */
  displayTime: string;
  lane: NorthbankTimelineLane;
  title: string;
  subtitle: string;
  badge: string;
  status?: string;
  linkedRecordType: string;
  linkedRecordId: string;
  relatedRecordIds: string[];
  modalType: string;
  intake?: NorthbankTimelineIntakeMeta;
  impact?: NorthbankTimelineImpactMeta;
};

export type NorthbankDataset = {
  issue: NorthbankIssueExport;
  incomingUpdates: NorthbankIncomingUpdate[];
  sources: NorthbankSourceExport[];
  claims: NorthbankClaimExport[];
  openQuestions: NorthbankOpenQuestionExport[];
  observations: NorthbankObservationExport[];
  outputs: NorthbankOutputExport[];
  circulationEvents: NorthbankCirculationExport[];
  timelineProjection: NorthbankTimelineItem[];
};
