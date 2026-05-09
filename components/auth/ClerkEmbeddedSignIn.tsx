"use client";

import { useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

function safeRedirectTarget(raw: string | null) {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  if (raw === "/login" || raw.startsWith("/login/") || raw.startsWith("/login?")) return "/";
  return raw;
}

/**
 * Embedded Clerk sign-in on `/login` when Clerk env is enabled.
 * Redirect target mirrors the legacy password form (`from` search param).
 */
export function ClerkEmbeddedSignIn() {
  const sp = useSearchParams();
  const from = sp.get("from");
  const target = safeRedirectTarget(from);

  return (
    <div className="mt-6 border-t border-[--metis-paper-line] pt-6">
      <p className="mb-3 text-sm text-[--metis-paper-muted]">Or continue with organisation SSO (Clerk).</p>
      <SignIn
        routing="hash"
        forceRedirectUrl={target}
        fallbackRedirectUrl={target}
        signUpFallbackRedirectUrl={target}
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border border-[--metis-paper-line] bg-[--metis-paper] text-[--metis-paper-text]",
          },
        }}
      />
    </div>
  );
}
