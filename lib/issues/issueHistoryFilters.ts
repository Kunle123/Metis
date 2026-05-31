import type { IssueHistoryEventCard, IssueHistoryLane } from "./issueHistoryTypes";
import { issueHistoryLaneToUi } from "./issueHistoryTypes";

export type IssueHistoryLaneFilter = "all" | "input" | "issue" | "output";

export type IssueHistoryTypeFilter =
  | "all"
  | "inputs"
  | "claims_questions"
  | "briefs_messages"
  | "circulation_export";

export type IssueHistoryDensity = "comfortable" | "compact";

export type IssueHistoryEventTypeCategory =
  | "inputs"
  | "claims_questions"
  | "briefs_messages"
  | "circulation_export";

export type IssueHistoryFilterState = {
  lane: IssueHistoryLaneFilter;
  type: IssueHistoryTypeFilter;
  sinceLastBrief: boolean;
  density: IssueHistoryDensity;
};

export function classifyIssueHistoryEventType(event: IssueHistoryEventCard): IssueHistoryEventTypeCategory {
  switch (event.modalType) {
    case "incoming_update":
      return "inputs";
    case "brief":
    case "message":
    case "brief_comparison":
      return "briefs_messages";
    case "export":
    case "circulation":
      return "circulation_export";
    default:
      return "claims_questions";
  }
}

export function laneFilterMatches(event: IssueHistoryEventCard, lane: IssueHistoryLaneFilter): boolean {
  if (lane === "all") return true;
  return issueHistoryLaneToUi(event.lane) === lane;
}

export function typeFilterMatches(event: IssueHistoryEventCard, type: IssueHistoryTypeFilter): boolean {
  if (type === "all") return true;
  return classifyIssueHistoryEventType(event) === type;
}

export function sinceBriefFilterMatches(
  event: IssueHistoryEventCard,
  sinceLastBrief: boolean,
  latestBriefTimestamp: string | null | undefined,
): boolean {
  if (!sinceLastBrief || !latestBriefTimestamp) return true;
  return event.timestamp.localeCompare(latestBriefTimestamp) > 0;
}

export function filterIssueHistoryEvents(
  events: IssueHistoryEventCard[],
  options: {
    lane?: IssueHistoryLaneFilter;
    type?: IssueHistoryTypeFilter;
    sinceLastBrief?: boolean;
    latestBriefTimestamp?: string | null;
  },
): IssueHistoryEventCard[] {
  const lane = options.lane ?? "all";
  const type = options.type ?? "all";
  const sinceLastBrief = options.sinceLastBrief ?? false;

  return events.filter(
    (event) =>
      laneFilterMatches(event, lane) &&
      typeFilterMatches(event, type) &&
      sinceBriefFilterMatches(event, sinceLastBrief, options.latestBriefTimestamp),
  );
}

export function countEventsByLane(events: IssueHistoryEventCard[]): Record<IssueHistoryLaneFilter, number> {
  const counts = { all: events.length, input: 0, issue: 0, output: 0 };
  for (const event of events) {
    const ui = issueHistoryLaneToUi(event.lane);
    counts[ui] += 1;
  }
  return counts;
}

export function historyHasOnlyInputLane(events: IssueHistoryEventCard[]): boolean {
  if (events.length === 0) return false;
  return events.every((e) => e.lane === "incoming_update");
}

export function lanesWithEvents(events: IssueHistoryEventCard[]): IssueHistoryLane[] {
  const set = new Set<IssueHistoryLane>();
  for (const event of events) {
    set.add(event.lane);
  }
  const order: IssueHistoryLane[] = ["incoming_update", "issue_record", "metis_output"];
  return order.filter((lane) => set.has(lane));
}

export function filtersAreActive(state: Pick<IssueHistoryFilterState, "lane" | "type" | "sinceLastBrief">): boolean {
  return state.lane !== "all" || state.type !== "all" || state.sinceLastBrief;
}
