import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@metis/shared/auth";

const METIS_MEMBERSHIP_ADMIN = "Admin";
const METIS_MEMBERSHIP_USER = "User";
const METIS_MEMBERSHIP_VIEWER = "Viewer";

/** Default global role for JIT Clerk users; product access is `Membership.role`. */
const JIT_USER_GLOBAL_ROLE: UserRole = "Viewer";

/**
 * Maps Clerk organisation membership role strings to Metis `Membership.role`.
 * Metis remains authoritative for enforcement; this only seeds/updates stored values.
 */
export function mapClerkOrgRoleToMetisMembershipRole(clerkRole: string | null | undefined): string {
  const raw = (clerkRole ?? "").trim().toLowerCase();
  if (!raw) {
    console.warn("[clerkOrgSync] empty Clerk org role; defaulting Membership.role to Viewer");
    return METIS_MEMBERSHIP_VIEWER;
  }

  if (raw === "org:admin" || raw === "admin" || raw.endsWith(":admin")) return METIS_MEMBERSHIP_ADMIN;
  if (raw === "org:viewer" || raw === "viewer" || raw.endsWith(":viewer")) return METIS_MEMBERSHIP_VIEWER;
  if (raw === "org:member" || raw === "basic_member" || raw === "member" || raw.includes("member")) return METIS_MEMBERSHIP_USER;

  console.warn(`[clerkOrgSync] unknown Clerk org role "${clerkRole}"; defaulting Membership.role to Viewer`);
  return METIS_MEMBERSHIP_VIEWER;
}

/** URL-safe slug; falls back if empty. */
export function metisSlugFromClerkParts(input: { slug?: string | null; name?: string | null; clerkOrgId: string }): string {
  const fromSlug = (input.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (fromSlug.length >= 2) return fromSlug.slice(0, 120);
  const fromName = (input.name ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (fromName.length >= 2) return fromName.slice(0, 120);
  const tail = input.clerkOrgId.replace(/^org_/, "").slice(0, 24) || "workspace";
  return `org-${tail}`.slice(0, 120);
}

async function ensureUniqueOrganisationSlug(base: string, excludeOrganisationId?: string): Promise<string> {
  let candidate = base.slice(0, 120) || "workspace";
  let n = 0;
  for (;;) {
    const found = await prisma.organisation.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!found || found.id === excludeOrganisationId) return candidate;
    n += 1;
    const suffix = `-${n}`;
    candidate = `${base.slice(0, 120 - suffix.length)}${suffix}`;
  }
}

type ClerkOrgPayload = {
  id?: string;
  name?: string;
  slug?: string;
};

export function clerkOrgPayloadFromUnknown(raw: Record<string, unknown>): ClerkOrgPayload | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;
  return {
    id,
    name: typeof raw.name === "string" ? raw.name : undefined,
    slug: typeof raw.slug === "string" ? raw.slug : undefined,
  };
}

function clerkOrgPayloadToRecord(o: ClerkOrgPayload): Record<string, unknown> {
  const out: Record<string, unknown> = { id: o.id! };
  if (o.name !== undefined) out.name = o.name;
  if (o.slug !== undefined) out.slug = o.slug;
  return out;
}

async function enrichClerkOrgPayload(data: ClerkOrgPayload): Promise<ClerkOrgPayload> {
  const id = data.id?.trim();
  if (!id) return data;
  if (data.name?.trim() || data.slug?.trim()) return data;
  try {
    const client = await clerkClient();
    const o = await client.organizations.getOrganization({ organizationId: id });
    return { id: o.id, name: o.name ?? undefined, slug: o.slug ?? undefined };
  } catch (e) {
    console.warn("[clerkOrgSync] could not enrich Clerk organisation from API", id, e);
    return data;
  }
}

/**
 * Upsert Metis `Organisation` from Clerk organization webhook `data`.
 * Idempotent on `clerkOrgId`.
 */
export async function upsertOrganisationFromClerkWebhook(raw: Record<string, unknown>): Promise<{ id: string } | null> {
  const parsed = clerkOrgPayloadFromUnknown(raw);
  if (!parsed) return null;
  const enriched = await enrichClerkOrgPayload(parsed);
  const clerkOrgId = enriched.id?.trim();
  if (!clerkOrgId) return null;

  const name = (enriched.name?.trim() || "Workspace").slice(0, 200);
  const baseSlug = metisSlugFromClerkParts({ slug: enriched.slug, name: enriched.name, clerkOrgId });

  const existing = await prisma.organisation.findUnique({ where: { clerkOrgId } });
  if (existing) {
    const slug = await ensureUniqueOrganisationSlug(baseSlug, existing.id);
    await prisma.organisation.update({
      where: { id: existing.id },
      data: { name, slug, status: "Active" },
    });
    return { id: existing.id };
  }

  const slug = await ensureUniqueOrganisationSlug(baseSlug);
  const created = await prisma.organisation.create({
    data: {
      name,
      slug,
      clerkOrgId,
      status: "Active",
    },
    select: { id: true },
  });
  return created;
}

function primaryEmailFromWebhookUserJson(data: Record<string, unknown>): string | null {
  const emails = (data.email_addresses as { email_address?: string; id?: string }[] | undefined) ?? [];
  const primaryId = data.primary_email_address_id as string | undefined;
  const primary =
    (primaryId && emails.find((e) => e.id === primaryId)?.email_address) ??
    emails.find((e) => typeof e.email_address === "string" && e.email_address.length)?.email_address;
  if (!primary || typeof primary !== "string") return null;
  return primary.trim().toLowerCase();
}

/**
 * Upsert local `User` from Clerk `user` webhook JSON or after API fetch.
 */
export async function upsertUserFromClerkPayload(data: {
  id: string;
  email?: string | null;
  /** Raw Clerk user object from webhook (snake_case). */
  clerkUserJson?: Record<string, unknown> | null;
}): Promise<{ id: string } | null> {
  const clerkUserId = data.id.trim();
  if (!clerkUserId) return null;

  let email = (data.email ?? "").trim().toLowerCase();
  if (!email && data.clerkUserJson) {
    email = primaryEmailFromWebhookUserJson(data.clerkUserJson) ?? "";
  }
  if (!email) {
    try {
      const clerk = await clerkClient();
      const u = await clerk.users.getUser(clerkUserId);
      const extracted =
        u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
        u.emailAddresses?.[0]?.emailAddress;
      email = (extracted ?? "").trim().toLowerCase();
    } catch {
      return null;
    }
  }
  if (!email) return null;

  const linked = await prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
  if (linked) {
    const row = await prisma.user.findUnique({ where: { id: linked.id }, select: { email: true } });
    if (row && row.email !== email) {
      const conflict = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (conflict && conflict.id !== linked.id) {
        console.warn(`[clerkOrgSync] email ${email} belongs to another user; skipping email change for ${clerkUserId}`);
      } else {
        await prisma.user.update({ where: { id: linked.id }, data: { email } });
      }
    }
    return { id: linked.id };
  }

  const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true, clerkUserId: true } });
  if (byEmail) {
    await prisma.user.update({
      where: { id: byEmail.id },
      data: { clerkUserId },
    });
    return { id: byEmail.id };
  }

  const created = await prisma.user.create({
    data: {
      email,
      clerkUserId,
      passwordHash: null,
      role: JIT_USER_GLOBAL_ROLE,
    },
    select: { id: true },
  });
  return created;
}

function clerkMembershipSliceFromUnknown(raw: Record<string, unknown>): {
  organization: ClerkOrgPayload | null;
  clerkUserId: string | null;
  role: string | undefined;
} {
  const orgRaw = raw.organization;
  const orgObj = orgRaw && typeof orgRaw === "object" ? (orgRaw as Record<string, unknown>) : null;
  const organization = orgObj ? clerkOrgPayloadFromUnknown(orgObj) : null;

  const pudRaw = raw.public_user_data;
  const pud = pudRaw && typeof pudRaw === "object" ? (pudRaw as Record<string, unknown>) : null;
  let clerkUserId: string | null = null;
  if (pud) {
    const uid = pud.user_id ?? pud.userId;
    if (typeof uid === "string" && uid.trim()) clerkUserId = uid.trim();
  }

  const role = typeof raw.role === "string" ? raw.role : undefined;
  return { organization, clerkUserId, role };
}

/**
 * Upsert org + user + membership from `organizationMembership.*` webhook payloads.
 */
export async function upsertMembershipFromClerkWebhook(raw: Record<string, unknown>): Promise<void> {
  const { organization: orgJson, clerkUserId, role } = clerkMembershipSliceFromUnknown(raw);
  if (!orgJson?.id) return;

  const org = await upsertOrganisationFromClerkWebhook(clerkOrgPayloadToRecord(orgJson));
  if (!org) return;

  if (!clerkUserId) return;

  const user = await upsertUserFromClerkPayload({ id: clerkUserId });
  if (!user) return;

  const metisRole = mapClerkOrgRoleToMetisMembershipRole(role);

  await prisma.membership.upsert({
    where: {
      userId_organisationId: { userId: user.id, organisationId: org.id },
    },
    create: {
      userId: user.id,
      organisationId: org.id,
      role: metisRole,
    },
    update: { role: metisRole },
  });
}

/** Clerk org deleted/disabled — keep Metis data; mark organisation inactive. */
export async function deactivateOrganisationByClerkOrgId(clerkOrgId: string): Promise<void> {
  const id = clerkOrgId.trim();
  if (!id) return;
  await prisma.organisation.updateMany({
    where: { clerkOrgId: id },
    data: { status: "Inactive" },
  });
}

/** Remove Metis membership when Clerk org membership is removed. Does not delete `User`. */
export async function deleteMembershipFromClerkWebhook(raw: Record<string, unknown>): Promise<void> {
  const { organization, clerkUserId } = clerkMembershipSliceFromUnknown(raw);
  const clerkOrgId = organization?.id?.trim();
  if (!clerkOrgId || !clerkUserId) return;

  const org = await prisma.organisation.findUnique({ where: { clerkOrgId }, select: { id: true } });
  const user = await prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
  if (!org || !user) return;

  await prisma.membership.deleteMany({
    where: { organisationId: org.id, userId: user.id },
  });
}

/** Sync email / clerk id from `user.updated` webhook. */
export async function syncUserFromClerkUserWebhook(data: Record<string, unknown>): Promise<void> {
  const id = typeof data.id === "string" ? data.id.trim() : "";
  if (!id) return;
  await upsertUserFromClerkPayload({ id, clerkUserJson: data });
}
