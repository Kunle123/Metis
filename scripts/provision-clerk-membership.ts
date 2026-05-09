/**
 * Bootstrap / repair a Metis membership for a local user and organisation (by slug or id).
 * Does not call Clerk; use when webhooks are unavailable or for manual pilot setup.
 *
 * Usage:
 *   npx tsx scripts/provision-clerk-membership.ts <userEmail> <organisationSlugOrId> <Admin|User|Viewer>
 *
 * Requires DATABASE_URL.
 */
import { PrismaClient } from "@prisma/client";

const ROLES = new Set(["Admin", "User", "Viewer"]);

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const orgKey = process.argv[3]?.trim();
  const role = process.argv[4]?.trim();
  if (!email || !orgKey || !role || !ROLES.has(role)) {
    console.error("Usage: npx tsx scripts/provision-clerk-membership.ts <userEmail> <organisationSlugOrId> <Admin|User|Viewer>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      console.error(`No user with email ${email}`);
      process.exit(1);
    }

    const org =
      (await prisma.organisation.findFirst({
        where: { OR: [{ id: orgKey }, { slug: orgKey }] },
        select: { id: true, name: true, slug: true },
      })) ?? null;
    if (!org) {
      console.error(`No organisation with id or slug ${orgKey}`);
      process.exit(1);
    }

    await prisma.membership.upsert({
      where: { userId_organisationId: { userId: user.id, organisationId: org.id } },
      create: { userId: user.id, organisationId: org.id, role },
      update: { role },
    });

    console.log(JSON.stringify({ ok: true, userId: user.id, organisationId: org.id, organisationSlug: org.slug, role }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
