import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";

export default async function SetupPage() {
  return (
    <MetisShell activePath="/setup" pageTitle="Setup">
      <SurfaceCard>
        <div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
          <div className="space-y-2">
            <p className="text-base text-[--metis-paper]">Setup is not available yet.</p>
            <p className="text-sm leading-7 text-[--metis-paper-muted]">Issue intake and workspace setup will land here.</p>
          </div>
          <div>
            <Button asChild className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]">
              <Link href="/">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </SurfaceCard>
    </MetisShell>
  );
}

