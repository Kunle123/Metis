import { notFound, redirect } from "next/navigation";
import { Playfair_Display, IBM_Plex_Mono } from "next/font/google";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell } from "@/components/MetisShell";
import { IssueHistoryPageClient } from "@/components/issues/history/IssueHistoryPage.client";
import { activeIssueForMetisShell } from "@/lib/issues/activeIssueForShell";
import { issueHistoryPerfLog, issueHistoryPerfStart } from "@/lib/issues/issueHistoryPerf";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-history-display",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-history-mono",
  display: "swap",
});

export const dynamic = "force-dynamic";

export default async function IssueHistoryPage({ params }: { params: Promise<{ issueId: string }> }) {
  const endPage = issueHistoryPerfStart("IssueHistoryPage (shell + context)");
  const { issueId } = await params;
  const page = await loadIssuePageContext(issueId);
  if (page.outcome === "unauthorized") redirect("/login");
  if (page.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (page.outcome === "not_found") notFound();

  const { issue } = page;
  const controlledPositionHeadline = issue.summary.trim().slice(0, 120) || issue.title;
  const controlledPositionDetail = [issue.status, issue.operatorPosture].filter(Boolean).join(" · ");

  issueHistoryPerfLog("IssueHistoryPage shell ready", { issueId });
  endPage();

  return (
    <MetisShell
      activePath="/history"
      pageTitle="History"
      organisationMembershipRole={page.context.membership.role}
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={activeIssueForMetisShell(issue)}
    >
      <div
        className={`${playfair.variable} ${ibmPlexMono.variable} min-w-0 overflow-hidden rounded-[1.1rem] border border-[--metis-outline-subtle]`}
      >
        <IssueHistoryPageClient
          issueId={issueId}
          issueTitle={issue.title}
          controlledPositionHeadline={controlledPositionHeadline}
          controlledPositionDetail={controlledPositionDetail}
        />
      </div>
    </MetisShell>
  );
}
