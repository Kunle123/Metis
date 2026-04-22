/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ROLES = new Set(["Viewer", "Operator", "Admin"]);

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v.trim();
}

async function main() {
  const email = requireEnv("METIS_PROVISION_EMAIL").toLowerCase();
  const password = requireEnv("METIS_PROVISION_PASSWORD");
  const role = requireEnv("METIS_PROVISION_ROLE");

  if (!ROLES.has(role)) {
    throw new Error(`Invalid METIS_PROVISION_ROLE: ${role} (expected Viewer|Operator|Admin)`);
  }

  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role },
    update: { passwordHash, role },
  });

  console.log(
    JSON.stringify(
      { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
