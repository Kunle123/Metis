/**
 * Guards dangerous data scripts (`db:seed`, `db:clean-validation-users`).
 *
 * **What runs here**
 * - `prisma db seed`: loads fixed demo fixtures (deterministic seeded issues/brief rows). Intended for **local laptops and non-production databases** — not primary customer onboarding.
 *
 * **`db:clean-validation-users`** deletes disposable QA accounts listed in that script — **never** intended for shared or customer production.
 *
 * **Production bootstrap** is an explicit operational process separate from demo seed — create users/Tenants/schema via migrations and your provisioning story, **not** this seed file.
 *
 * **Expected configuration:** set `APP_ENV` to `local`, `staging`, `development`, `test`, or `preview`
 * (`production` is blocked unless you deliberately override below). Omitting `APP_ENV` is allowed only when
 * the deployment host does not advertise production (`VERCEL_ENV`, `RAILWAY_ENVIRONMENT`, `NODE_ENV`) or you
 * have marked staging explicitly with `APP_ENV`.
 */

const OVERRIDE_ENV = "ALLOW_PRODUCTION_DATA_SCRIPT";

/** When `NODE_ENV === "production"`, these `APP_ENV` values treat the runtime as deliberately non‑prod (staging/preview/demo). */
const NON_PRODUCTION_APP_ENV_WHEN_NODE_PRODUCTION = new Set([
  "local",
  "development",
  "staging",
  "test",
  "preview",
  "preview-branch",
]);

function trimLower(raw: string | undefined): string | undefined {
  const t = raw?.trim().toLowerCase();
  return t && t.length > 0 ? t : undefined;
}

function normalizeBool(raw: string | undefined): boolean {
  const v = trimLower(raw);
  return v === "true" || v === "1" || v === "yes";
}

/** True when Postgres URL hostname looks like RDS (common managed prod); staging may use RDS too — pairing with APP_ENV=staging satisfies Node production staging. */
function databaseUrlHostnameLooksLikelyHostedProd(databaseUrl: string | undefined): boolean {
  const u = databaseUrl?.trim();
  if (!u) return false;
  try {
    let host: string | null = null;
    if (u.startsWith("postgresql://") || u.startsWith("postgres://")) {
      const parsed = new URL(u.replace(/^postgres(ql)?:\/\//, "postgresql://"));
      host = parsed.hostname?.toLowerCase() ?? "";
    }
    if (!host || host === "localhost" || host === "127.0.0.1") return false;
    // Broad but conservative: managed cloud Postgres endpoints (not exhaustive).
    if (host.endsWith(".rds.amazonaws.com")) return true;
    if (host.endsWith(".neon.tech")) return true;
    if (host.endsWith(".supabase.co")) return true;
    if (host.includes("azure.com") && host.includes("postgres")) return true;
    return false;
  } catch {
    return false;
  }
}

export class ProductionDataScriptRefusedError extends Error {
  readonly name = "ProductionDataScriptRefusedError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ProductionDataScriptRefusedError.prototype);
  }
}

/**
 * Throws if this process appears pointed at production (or ambiguous high‑risk combo) unless
 * `ALLOW_PRODUCTION_DATA_SCRIPT=true` is explicitly set by an operator who accepts the blast radius.
 *
 * Detection is heuristic and **never** substitutes for disciplined deploy practices.
 */
export function assertAllowedNonProductionDataScript(scriptLabel: string): void {
  const reasonPrefix = `[${scriptLabel}] Refusing to run demo data script against production (or equivalent).`;

  if (normalizeBool(process.env[OVERRIDE_ENV])) {
    return;
  }

  const appEnv = trimLower(process.env.APP_ENV);
  const nodeEnv = trimLower(process.env.NODE_ENV);
  const vercelEnv = trimLower(process.env.VERCEL_ENV);
  const railwayEnv = trimLower(process.env.RAILWAY_ENVIRONMENT);
  const databaseUrl = typeof process.env.DATABASE_URL === "string" ? process.env.DATABASE_URL : undefined;

  if (appEnv === "production") {
    throw new ProductionDataScriptRefusedError(
      `${reasonPrefix} APP_ENV is "production".
Set APP_ENV=staging or APP_ENV=local for non-production databases, or set ${OVERRIDE_ENV}=true only if you are intentionally operating on production.`,
    );
  }

  if (vercelEnv === "production") {
    throw new ProductionDataScriptRefusedError(
      `${reasonPrefix} VERCEL_ENV indicates a Vercel production deployment.
Production must not execute demo seed or validation cleanup. Set ${OVERRIDE_ENV}=true only if you are intentionally overriding this guard.`,
    );
  }

  if (railwayEnv === "production") {
    throw new ProductionDataScriptRefusedError(
      `${reasonPrefix} RAILWAY_ENVIRONMENT indicates Railway production.
Set ${OVERRIDE_ENV}=true only if you are intentionally overriding this guard.`,
    );
  }

  if (nodeEnv === "production") {
    if (!appEnv || !NON_PRODUCTION_APP_ENV_WHEN_NODE_PRODUCTION.has(appEnv)) {
      throw new ProductionDataScriptRefusedError(
        `${reasonPrefix} NODE_ENV is "production" and APP_ENV is not one of [${[...NON_PRODUCTION_APP_ENV_WHEN_NODE_PRODUCTION].join(", ")}].
For staging/builds using NODE_ENV=production, set e.g. APP_ENV=staging. Set ${OVERRIDE_ENV}=true only if intentional.`,
      );
    }
  }

  const hostedDb = databaseUrlHostnameLooksLikelyHostedProd(databaseUrl);
  const appAllowsHosted = Boolean(appEnv && NON_PRODUCTION_APP_ENV_WHEN_NODE_PRODUCTION.has(appEnv));
  /** Block cloud-looking DB URLs without an explicit APP_ENV staging/local/etc. Tests often use local docker hostnames → not flagged here. */
  if (hostedDb && !appAllowsHosted && nodeEnv !== "test") {
    throw new ProductionDataScriptRefusedError(
      `${reasonPrefix} DATABASE_URL resolves to a cloud-managed Postgres hostname and APP_ENV is not set to an explicit non-production value (${[...NON_PRODUCTION_APP_ENV_WHEN_NODE_PRODUCTION].join(", ")} recommended).
This prevents accidental seed/cleanup against a shared database. Override with ${OVERRIDE_ENV}=true only if deliberate.`,
    );
  }
}
