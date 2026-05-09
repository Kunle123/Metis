/**
 * Link an existing Metis organisation to a Clerk organisation id (`org_*`).
 *
 * Usage:
 *   npx tsx scripts/link-clerk-org.ts <metisOrganisationId> <clerkOrgId>
 *
 * Requires DATABASE_URL. Run after `prisma migrate deploy`.
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const metisOrganisationId = process.argv[2]?.trim();
  const clerkOrgId = process.argv[3]?.trim();
  if (!metisOrganisationId || !clerkOrgId) {
    console.error("Usage: npx tsx scripts/link-clerk-org.ts <metisOrganisationId> <clerkOrgId>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const taken = await prisma.organisation.findUnique({ where: { clerkOrgId }, select: { id: true, name: true } });
    if (taken && taken.id !== metisOrganisationId) {
      console.error(`clerkOrgId already linked to organisation ${taken.id} (${taken.name})`);
      process.exit(1);
    }
    await prisma.organisation.update({
      where: { id: metisOrganisationId },
      data: { clerkOrgId },
    });
    console.log(JSON.stringify({ ok: true, metisOrganisationId, clerkOrgId }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
