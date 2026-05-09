import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";

export function NoOrganisationMembershipShell() {
  return (
    <MetisShell activePath="/" pageTitle="Issues Dashboard">
      <SurfaceCard className="min-w-0 overflow-hidden">
        <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-5 sm:px-7">
          <h3 className="font-[Cormorant_Garamond] text-2xl text-[--metis-paper]">Organisation access</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[--metis-paper-muted]">
            You are signed in, but no organisation workspace is assigned to this account. Ask an administrator to grant access.
          </p>
        </div>
        <div className="px-6 py-8 sm:px-7">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/login">Return to sign-in</Link>
          </Button>
        </div>
      </SurfaceCard>
    </MetisShell>
  );
}
