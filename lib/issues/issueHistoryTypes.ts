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
};

export type IssueHistoryModalPayload = {
  summary: string;
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
    href?: string;
  };
  fullRecordSections?: { heading: string; body: string }[];
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
