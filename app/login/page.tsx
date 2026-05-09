import { Suspense } from "react";

import { ClerkEmbeddedSignIn } from "@/components/auth/ClerkEmbeddedSignIn";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { isMetisClerkEnabled } from "@/lib/auth/clerkEnv";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const clerkEnabled = isMetisClerkEnabled();

  return (
    <MetisShell activePath="/" pageTitle="Sign in" showOperationalSnapshot={false}>
      <div className="mx-auto w-full max-w-md">
        <SurfaceCard>
          <div className="space-y-4 px-5 py-6 sm:px-6 sm:py-7">
            <p className="text-sm text-[--metis-paper-muted]">Use your Metis account credentials.</p>
            <Suspense fallback={<div className="text-sm text-[--metis-paper-muted]">Loading…</div>}>
              <LoginForm />
            </Suspense>
            {clerkEnabled ? (
              <Suspense fallback={<div className="text-sm text-[--metis-paper-muted]">Loading SSO…</div>}>
                <ClerkEmbeddedSignIn />
              </Suspense>
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
