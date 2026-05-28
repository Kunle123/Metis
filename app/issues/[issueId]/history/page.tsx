import { notFound, redirect } from "next/navigation";
import { Playfair_Display, IBM_Plex_Mono } from "next/font/google";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell } from "@/components/MetisShell";
import { IssueHistoryTimeline } from "@/components/issues/history/IssueHistoryTimeline.client";
import { buildIssueHistoryProjection } from "@/lib/issues/buildIssueHistoryProjection";
import { activeIssueForMetisShell } from "@/lib/issues/activeIssueForShell";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-history-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-history-mono",
});

export const dynamic = "force-dynamic";

export default async function IssueHistoryPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const page = await loadIssuePageContext(issueId);
  if (page.outcome === "unauthorized") redirect("/login");
  if (page.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (page.outcome === "not_found") notFound();

  const projection = await buildIssueHistoryProjection(issueId, {
    membershipRole: page.context.membership.role,
    userId: page.context.user.id,
  });

  return (
    <MetisShell
      activePath="/history"
      pageTitle="Issue history"
      organisationMembershipRole={page.context.membership.role}
      issueRoutePrefix={`/issues/${page.issue.id}`}
      activeIssue={activeIssueForMetisShell(page.issue)}
    >
      <div
        className={`${playfair.variable} ${ibmPlexMono.variable} min-w-0 overflow-hidden rounded-[1.1rem] border border-[--metis-outline-subtle]`}
        style={
          {
            fontFamily: "var(--font-history-display), Georgia, serif",
            ["--font-mono" as string]: "var(--font-history-mono), monospace",
          } as React.CSSProperties
        }
      >
        <IssueHistoryTimeline
          issueId={issueId}
          issueTitle={projection.issueTitle}
          controlledPositionHeadline={projection.controlledPositionHeadline}
          controlledPositionDetail={projection.controlledPositionDetail}
          events={projection.events}
        />
      </div>
    </MetisShell>
  );
}
