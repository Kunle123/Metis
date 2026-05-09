/**
 * Local/developer helper: deletes only known disposable validation accounts created during manual QA.
 * Does not modify issues, exports, or the demo operator seeded by prisma.
 *
 * Invoke: npm run db:clean-validation-users
 */

import { PrismaClient } from "@prisma/client";

/** Strict allow-list — extend only when a clearly disposable local email alias is documented. */
const DISPOSABLE_VALIDATION_EMAILS = ["live-brief-check@metis.local", "smoke-slice1@metis.local"] as const;

async function main() {
  const prisma = new PrismaClient();
  const result = await prisma.user.deleteMany({
    where: { email: { in: [...DISPOSABLE_VALIDATION_EMAILS] } },
  });
  console.log(JSON.stringify({ removedUsers: result.count, emailsTried: DISPOSABLE_VALIDATION_EMAILS }));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
});
