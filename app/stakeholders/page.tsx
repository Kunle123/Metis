import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";

import { StakeholderLibrary } from "./stakeholder-library";

export const dynamic = "force-dynamic";

export default async function StakeholdersPage() {
  const groups = await prisma.stakeholderGroup.findMany({
    orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
  });

  return (
    <MetisShell activePath="/stakeholders" pageTitle="Stakeholder library">
      <SurfaceCard>
        <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
          <div className="space-y-2">
            <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Stakeholders</h2>
            <p className="text-sm leading-6 text-[--metis-paper-muted]">
              Manage your standing stakeholder groups. Issues can select a subset and add issue-specific guidance.
            </p>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-7 sm:py-7">
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
        </div>
      </SurfaceCard>
    </MetisShell>
  );
}

