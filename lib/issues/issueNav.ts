/**
 * Issue-scoped navigation paths and helpers (relative to `issueRoutePrefix`).
 */

export const ISSUE_RECORD_ACTIVE_PATH = "/issue-record" as const;

export const issueRecordNavItem = {
  id: "issue-record",
  path: ISSUE_RECORD_ACTIVE_PATH,
  shortLabel: "Issue record",
} as const;

/** Primary intake: free-text capture on the Input page. */
export const issueInputNavItem = {
  id: "input",
  path: "/input",
  shortLabel: "Input",
} as const;

/** Structured registers — linked from issue record home, not primary side nav. */
export const issueRegisterNavItems = [
  { id: "sources", path: "/sources", shortLabel: "Sources" },
  { id: "claims", path: "/claims", shortLabel: "Claims" },
  { id: "gaps", path: "/gaps", shortLabel: "Open questions" },
] as const;

export const issueRecordFacetPaths = issueRegisterNavItems.map((i) => i.path);

/** Generated outputs from the issue record. */
export const issueOutputsNavItems = [
  { id: "brief", path: "/brief", shortLabel: "Brief" },
  { id: "messages", path: "/messages", shortLabel: "Messages" },
  { id: "export", path: "/export", shortLabel: "Export" },
] as const;

/** Review and coordination tools. */
export const issueReviewNavItems = [
  { id: "activity", path: "/activity", shortLabel: "Activity" },
  { id: "compare", path: "/compare", shortLabel: "Compare" },
  { id: "comms-plan", path: "/comms-plan", shortLabel: "Comms plan" },
] as const;

/** Record home facets — drill into structured views of the same issue record. */
export const issueRecordViewItems = [
  {
    id: "overview",
    path: ISSUE_RECORD_ACTIVE_PATH,
    label: "Overview",
    detail: "Whole record at a glance",
    statKey: null,
  },
  {
    id: "sources",
    path: "/sources",
    label: "Sources",
    detail: "Evidence and artefacts",
    statKey: "Sources",
  },
  {
    id: "claims",
    path: "/claims",
    label: "Claims",
    detail: "Facts and assumptions register",
    statKey: "Claims",
  },
  {
    id: "gaps",
    path: "/gaps",
    label: "Open questions",
    detail: "Unresolved needs on the tracker",
    statKey: "Open questions",
  },
  {
    id: "input",
    path: "/input",
    label: "Input",
    detail: "Observations and captured notes",
    statKey: "Input",
  },
  {
    id: "activity",
    path: "/activity",
    label: "Activity",
    detail: "Changes across the record",
    statKey: null,
  },
] as const;

export type IssueNavItemId =
  | typeof issueRecordNavItem.id
  | typeof issueInputNavItem.id
  | (typeof issueRegisterNavItems)[number]["id"]
  | (typeof issueOutputsNavItems)[number]["id"]
  | (typeof issueReviewNavItems)[number]["id"];

export function issueHrefForNavItem(issueRoutePrefix: string, item: { id: string; path: string }) {
  if (item.id === issueRecordNavItem.id || item.path === ISSUE_RECORD_ACTIVE_PATH) return issueRoutePrefix;
  return `${issueRoutePrefix}${item.path}`;
}

/** Whether a side-nav item should show as active for the current `activePath`. */
export function issueSideNavItemIsActive(
  activePath: string,
  item: { id: string; path: string },
): boolean {
  if (item.id === issueRecordNavItem.id) {
    return (
      activePath === ISSUE_RECORD_ACTIVE_PATH ||
      (issueRecordFacetPaths as readonly string[]).includes(activePath)
    );
  }
  return item.path === activePath;
}

/** Free-text capture anchor on the Input page. */
export function issueAddInputHref(issueRoutePrefix: string) {
  return `${issueRoutePrefix}${issueInputNavItem.path}#capture-notes`;
}
