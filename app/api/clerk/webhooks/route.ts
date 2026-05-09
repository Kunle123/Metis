import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/backend/webhooks";

import {
  deactivateOrganisationByClerkOrgId,
  deleteMembershipFromClerkWebhook,
  syncUserFromClerkUserWebhook,
  upsertMembershipFromClerkWebhook,
  upsertOrganisationFromClerkWebhook,
} from "@/lib/organisations/clerkOrgSync";

export const runtime = "nodejs";

function webhookSigningSecret(): string | null {
  const a = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim();
  const b = process.env.CLERK_WEBHOOK_SECRET?.trim();
  return a || b || null;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  const signingSecret = webhookSigningSecret();
  if (!signingSecret) {
    return NextResponse.json({ error: "Webhook signing secret not configured" }, { status: 503 });
  }

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const verified = await verifyWebhook(request, { signingSecret });
    evt = { type: verified.type, data: verified.data as unknown as Record<string, unknown> };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    console.warn("[clerk webhook] verify failed:", msg);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const type = evt.type;
  const data = evt.data ?? {};

  try {
    switch (type) {
      case "organization.created":
      case "organization.updated":
        await upsertOrganisationFromClerkWebhook(data);
        break;
      case "organization.deleted":
        if (typeof data.id === "string") await deactivateOrganisationByClerkOrgId(data.id);
        break;
      case "organizationMembership.created":
      case "organizationMembership.updated":
        await upsertMembershipFromClerkWebhook(data);
        break;
      case "organizationMembership.deleted":
        await deleteMembershipFromClerkWebhook(data);
        break;
      case "user.created":
      case "user.updated":
        await syncUserFromClerkUserWebhook(data);
        break;
      default:
        console.info("[clerk webhook] ignored event type:", type);
    }
  } catch (e) {
    console.error("[clerk webhook] handler error", type, e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
