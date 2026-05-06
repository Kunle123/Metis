import type { ReactNode } from "react";

/** Ensures `useSearchParams()` reflects ?theme=* on initial navigation (avoid static `searchParams` gaps). */
export const dynamic = "force-dynamic";

export default function DevUiLayout({ children }: { children: ReactNode }) {
  return children;
}
