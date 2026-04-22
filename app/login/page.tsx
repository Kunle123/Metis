import { Suspense } from "react";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <MetisShell activePath="/" pageTitle="Sign in" showOperationalSnapshot={false}>
      <div className="mx-auto w-full max-w-md">
        <SurfaceCard>
          <div className="space-y-4 px-5 py-6 sm:px-6 sm:py-7">
            <p className="text-sm text-[--metis-paper-muted]">Use your Metis account credentials.</p>
            <Suspense fallback={<div className="text-sm text-[--metis-paper-muted]">Loading…</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
