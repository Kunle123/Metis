import Link from "next/link";

import { SurfaceCard, MetisShell } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";
import { IssueSwitcher } from "@/app/issues/issue-switcher";

export const dynamic = "force-dynamic";

export default async function CompareLegacyPage() {
  return (
    <MetisShell activePath="/compare" pageTitle="Brief Delta">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <div className="space-y-6">
              <header className="space-y-3 border-b border-white/8 pb-6">
                <h2 className="font-[Cormorant_Garamond] text-[2.15rem] leading-none text-[--metis-paper]">Select an issue</h2>
                <p className="max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">
                  Compare is issue-scoped. Choose the issue you want to open.
                </p>
              </header>
              <IssueSwitcher routeKind="compare" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="grid gap-3 px-5 py-5">
            <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
              <Link href="/">Back to dashboard</Link>
            </Button>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

