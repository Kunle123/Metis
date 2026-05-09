import { redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { METIS_MEMBERSHIP_ROLE_ADMIN } from "@/lib/organisations/membershipAdminPolicy";
import { resolvePageOrganisationGate } from "@/lib/organisations/pageOrganisationGate";

import { OrganisationMembersAdminClient, type OrganisationMemberRow } from "./organisation-members-admin.client";

export const dynamic = "force-dynamic";

export default async function AdminOrganisationUsersPage() {
  const gate = await resolvePageOrganisationGate();
  if (!gate.ok) {
    if (gate.httpStatus === 401) redirect("/login");
    return <NoOrganisationMembershipShell />;
  }

  const { context } = gate;
  if (context.membership.role !== METIS_MEMBERSHIP_ROLE_ADMIN) {
    return (
      <MetisShell activePath="/admin/users" pageMeta="Settings" pageTitle="Workspace users" organisationMembershipRole={context.membership.role}>
        <SurfaceCard className="min-w-0 overflow-hidden">
          <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-6 sm:px-7">
            <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Workspace users</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[--metis-paper-muted]">
              Only organisation Admins can manage members. Your current role is <strong className="text-[--metis-paper]">{context.membership.role}</strong>.
            </p>
          </div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const organisationId = context.organisation.id;

  const memberships = await prisma.membership.findMany({
    where: { organisationId },
    include: {
      user: { select: { id: true, email: true, clerkUserId: true, createdAt: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  const adminCount = memberships.filter((m) => m.role === METIS_MEMBERSHIP_ROLE_ADMIN).length;
  const soleAdminMembershipId = adminCount === 1 ? (memberships.find((m) => m.role === METIS_MEMBERSHIP_ROLE_ADMIN)?.id ?? null) : null;

  const initialMembers: OrganisationMemberRow[] = memberships.map((m) => ({
    membershipId: m.id,
    userId: m.user.id,
    email: m.user.email,
    displayName: m.user.email,
    role: m.role,
    clerkLinked: Boolean(m.user.clerkUserId),
    membershipCreatedAt: m.createdAt.toISOString(),
    membershipUpdatedAt: m.updatedAt.toISOString(),
    userCreatedAt: m.user.createdAt.toISOString(),
  }));

  return (
    <MetisShell
      activePath="/admin/users"
      pageMeta="Settings"
      pageTitle="Workspace users"
      organisationMembershipRole={context.membership.role}
    >
      <SurfaceCard className="min-w-0 overflow-hidden">
        <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-5 sm:px-7">
          <div className="space-y-2">
            <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Workspace users</h2>
            <p className="max-w-3xl text-sm leading-6 text-[--metis-paper-muted]">
              Manage who can access this organisation in Metis and their product role. Changes apply only to this workspace.
            </p>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-7 sm:py-7">
          <OrganisationMembersAdminClient
            organisationName={context.organisation.name}
            currentUserId={context.user.id}
            initialMembers={initialMembers}
            soleAdminMembershipId={soleAdminMembershipId}
          />
        </div>
      </SurfaceCard>
    </MetisShell>
  );
}
