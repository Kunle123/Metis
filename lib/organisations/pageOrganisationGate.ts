import { createRequestMirroringCookies } from "@/lib/auth/serverCookiesRequest";

import { resolveActiveOrganisationContext, type ResolveActiveOrganisationContextResult } from "./activeOrganisationContext";

export async function resolvePageOrganisationGate(): Promise<ResolveActiveOrganisationContextResult> {
  const req = await createRequestMirroringCookies("/");
  return resolveActiveOrganisationContext(req);
}
