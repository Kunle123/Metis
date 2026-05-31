export type IssueHistoryLane = "incoming_update" | "issue_record" | "metis_output";

/** Client-safe lane key matching demo timeline assets. */
export type IssueHistoryLaneUi = "input" | "issue" | "output";

export type IssueHistoryImpactSummary = {
  sourcesLinked?: number;
  claimsAdded?: number;
  claimsUpdated?: number;
  questionsOpened?: number;
  questionsClosed?: number;
  observationsAdded?: number;
  statusUpdated?: boolean;
};

export type IssueHistoryImpactRecord = {
  id: string;
  code: string;
  label: string;
  href?: string;
  recordType?: string;
};

export type IssueHistoryRelatedRecord = IssueHistoryImpactRecord & {
  recordType?: string;
  href?: string;
};

export type IssueHistorySubmitterMeta = {
  role: string;
  name: string;
  confidence: string;
  timestamp: string;
  displayTime: string;
};

export type IssueHistoryRecordMeta = {
  recordType: string;
  changeSummary?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  href?: string;
};

export type IssueHistoryMessageWording = {
  draftBody: string;
  aiPolishedBody: string;
  defaultMode: "controlled_draft" | "ai_polished";
};

export type IssueHistoryGuardrails = {
  mustAvoid: string[];
  toneNotes?: string;
};

export type IssueHistoryModalPayload = {
  summary: string;
  submitterMeta?: IssueHistorySubmitterMeta;
  recordMeta?: IssueHistoryRecordMeta;
  submittedUpdate?: { heading: string; body: string };
  issueRecordImpact?: {
    sources?: IssueHistoryImpactRecord[];
    claims?: IssueHistoryImpactRecord[];
    questionsOpened?: IssueHistoryImpactRecord[];
    questionsClosed?: IssueHistoryImpactRecord[];
    observations?: IssueHistoryImpactRecord[];
    statusNote?: string;
  };
  outputMeta?: {
    audience?: string;
    status?: string;
    versionNumber?: number;
    templateLabel?: string;
    generatedAt?: string;
    href?: string;
  };
  messageWording?: IssueHistoryMessageWording;
  /** Primary message body when draft/polished toggle is not available. */
  messageBody?: string;
  guardrails?: IssueHistoryGuardrails;
  relatedRecords?: IssueHistoryRelatedRecord[];
  fullRecordSections?: { heading: string; body: string }[];
};

export type IssueHistoryGroupedRecordKind = "source" | "claim" | "question" | "observation";

export type IssueHistoryGroupedRecordItem = {
  kind: IssueHistoryGroupedRecordKind;
  id: string;
  title: string;
  code?: string;
};

/** Slim card payload for initial timeline render (no large bodies). */
export type IssueHistoryEventCard = {
  id: string;
  timestamp: string;
  displayTime: string;
  day: string;
  time: string;
  lane: IssueHistoryLane;
  title: string;
  subtitle?: string;
  badge: string;
  status?: string;
  linkedRecordType: string;
  linkedRecordId: string;
  relatedRecordIds?: string[];
  modalType: string;
  impactSummary?: IssueHistoryImpactSummary;
  impactChips?: string[];
  /** When set, record additions sharing this key are grouped into one card. */
  batchKey?: string;
  /** Compact list of records in a grouped addition card. */
  groupedRecords?: IssueHistoryGroupedRecordItem[];
};

export type IssueHistoryProjectionMeta = {
  issueId: string;
  issueTitle: string;
  controlledPositionHeadline: string;
  controlledPositionDetail: string;
};

export type IssueHistoryTruncation = {
  totalEvents: number;
  showingEvents: number;
  capped: boolean;
};

export type IssueHistoryTimelinePayload = IssueHistoryProjectionMeta & {
  events: IssueHistoryEventCard[];
  truncation: IssueHistoryTruncation;
  /** ISO timestamp of the newest brief version on this issue, for client-side shortcuts. */
  latestBriefTimestamp?: string | null;
};

/** @deprecated Use IssueHistoryEventCard for list + lazy detail fetch. */
export type IssueHistoryEvent = IssueHistoryEventCard & {
  modal?: IssueHistoryModalPayload;
};

export const ISSUE_HISTORY_MAX_EVENTS = 200;

export const ISSUE_HISTORY_LANE_CONFIG: Record<
  IssueHistoryLaneUi,
  {
    label: string;
    sublabel: string;
    color: string;
    textColor: string;
    badgeBackground: string;
  }
> = {
  input: {
    label: "Incoming Updates",
    sublabel: "Submissions added to the record",
    color: "#8FA38A",
    textColor: "#4A6B45",
    badgeBackground: "#EAF0E8",
  },
  issue: {
    label: "Issue Record",
    sublabel: "Metis record actions",
    color: "#263B2E",
    textColor: "#263B2E",
    badgeBackground: "#DDE8DA",
  },
  output: {
    label: "Metis Outputs",
    sublabel: "Generated messages and briefs",
    color: "#B78B45",
    textColor: "#8B6020",
    badgeBackground: "#F5E9D0",
  },
};

export function issueHistoryLaneToUi(lane: IssueHistoryLane): IssueHistoryLaneUi {
  if (lane === "incoming_update") return "input";
  if (lane === "issue_record") return "issue";
  return "output";
}
