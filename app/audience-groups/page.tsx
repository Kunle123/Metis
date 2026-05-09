import { redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { resolvePageOrganisationGate } from "@/lib/organisations/pageOrganisationGate";

import { StakeholderLibrary } from "./stakeholder-library";

export const dynamic = "force-dynamic";

export default async function AudienceGroupsPage() {
  const gate = await resolvePageOrganisationGate();
  if (!gate.ok) {
    if (gate.httpStatus === 401) redirect("/login");
    return <NoOrganisationMembershipShell />;
  }

  const organisationId = gate.context.organisation.id;

  const groups = await prisma.stakeholderGroup.findMany({
    where: { organisationId },
    orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
  });
  const activeCount = groups.filter((g) => g.isActive).length;
  const inactiveCount = Math.max(0, groups.length - activeCount);

  return (
    <MetisShell activePath="/audience-groups" pageMeta="Settings" pageTitle="Audience groups">
      <SurfaceCard className="min-w-0 overflow-hidden">
        <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-5 sm:px-7">
          <div className="space-y-2">
            <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Audience groups</h2>
            <p className="text-sm leading-6 text-[--metis-paper-muted]">
              Organisation-level, reusable audience groups available across issues. These shape Messages generation and Comms plan suggestions/targeting.
            </p>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-7 sm:py-7">
          <section aria-label="Audience group overview" className="space-y-3">
            <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)] sm:px-5">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Overview</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-secondary]">
                  {groups.length} total
                </span>
                <span className="rounded-full border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_52%,transparent)] px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[--metis-status-success-fg]">
                  {activeCount} active
                </span>
                <span className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_48%,transparent)] px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">
                  {inactiveCount} inactive
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[--metis-text-tertiary]">
                Groups shape draft wording defaults in Messages and audience targeting in Comms plan. They do not send messages and do not automatically
                rewrite existing saved drafts or plan items.
              </p>
            </div>
          </section>

          <StakeholderLibrary
            initialGroups={groups.map((g) => ({
              id: g.id,
              name: g.name,
              description: g.description ?? null,
              defaultSensitivity: g.defaultSensitivity ?? null,
              defaultChannels: g.defaultChannels ?? null,
              defaultToneGuidance: g.defaultToneGuidance ?? null,
              displayOrder: g.displayOrder,
              isActive: g.isActive,
              createdAt: g.createdAt.toISOString(),
              updatedAt: g.updatedAt.toISOString(),
            }))}
          />

          <section aria-label="Where audience groups are used" className="mt-6 space-y-3">
            <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_82%,transparent)] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)] sm:px-5">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Where used</p>
              <div className="mt-2 space-y-2 text-sm leading-6 text-[--metis-text-secondary]">
                <p>
                  <span className="text-[--metis-paper]">Messages</span> · Selected in the Audience group control to shape draft wording defaults and guidance.
                </p>
                <p>
                  <span className="text-[--metis-paper]">Comms plan</span> · Used for suggested rows and plan item audience targeting (and deep-links into
                  Messages).
                </p>
                <p className="text-xs leading-relaxed text-[--metis-text-tertiary]">
                  Edits affect future generation and suggestions. They do not automatically regenerate existing saved drafts or rewrite tracked plan history.
                </p>
              </div>
            </div>
          </section>
        </div>
      </SurfaceCard>
    </MetisShell>
  );
}
