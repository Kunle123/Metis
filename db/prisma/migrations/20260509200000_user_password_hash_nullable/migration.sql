-- Clerk-only identities do not store a bcrypt digest; legacy password users keep a non-null hash.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
