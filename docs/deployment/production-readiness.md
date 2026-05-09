# Production readiness & first-customer onboarding

This guide describes how Metis is intended to be operated across **local/dev**, **staging**, and **production** for pilot and first-customer onboarding. Where behaviour is still aspirational rather than coded, sections are labelled **planned**.

Today’s baseline is **PostgreSQL per environment**, **workspace isolation via Metis `Organisation` / `Membership`**, and **`Membership.role` gated writes**. Authentication is intentionally **transitional**: legacy **JWT + bcrypt** persists (`lib/auth/session.ts`), and **Clerk is an optional SSO bridge** when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set (`lib/auth/clerkUserBridge.ts`, `middleware.ts`). Product authorisation remains **Metis memberships** (`requireActiveOrganisationContext`, `membershipAllowsOrgWrite`); Clerk organisations only **hint active workspace** when `Organisation.clerkOrgId` matches the Clerk org id carried in session.

---

## 1. Environment model

### Local / dev

Purpose: engineer laptops, exploratory work, deterministic demo seed (`npm run db:seed`) if desired.

Characteristics:

- Separate `DATABASE_URL` from any shared environment  
- Typical `NODE_ENV=development`; set **`APP_ENV=local`** (recommended) especially if `DATABASE_URL` points at hosted Postgres — see demo script guard behaviour in §4  
- Demo seed may be applied; ephemeral validation users acceptable  

### Staging

Purpose: **QA**, **demo data**, **smoke users**, rehearsal of **`prisma migrate deploy`**, and release validation before promoting the **same Git commit/build** to production.

Rules:

| Rule | Detail |
|------|--------|
| Data | Staging databases may contain demo/fixture data (`db:seed`, manual smoke). |
| Separation | **Never** reuse production `DATABASE_URL`, production secrets, or production Clerk/workspace configuration in staging without a labelled exception |
| Promotion | Prefer **shipping the same immutable build artifact/commit** through staging → production; **avoid copying production rows into staging** except rare redacted restores for incident repro |
| Auth | Dedicated staging identity provider workspace (when Clerk arrives) vs production |

### Production

Purpose: **real pilot/customer organisations** and **real operational data**.

Rules:

| Rule | Detail |
|------|--------|
| Seed | **`npm run db:seed` is not production bootstrap** — see §4 |
| Data | Starts empty apart from migrated schema plus operator-created users and pilot content |
| Isolation | **Planned**: explicit organisation/workspace scoping beyond “one DB per tenant” |

---

## 2. Production requirements (checklist)

Use this before cutting over a pilot tenant.

### Core

- [ ] **Application** deployed to production-tier hosting (HTTPS, sane timeouts, scaling plan understood)  
- [ ] **`APP_ENV=production`** set in production runtime (see [`scripts/guards/assertNonProductionDataScript.ts`](../../scripts/guards/assertNonProductionDataScript.ts) for rationale)  
- [ ] **`NODE_ENV=production`** for optimised Next builds  
- [ ] **Production Postgres** provisioned (`DATABASE_URL` unique to prod) — backups configured (below)  
- [ ] **`npx prisma migrate deploy`** exercised on staging first with the target migration set, then on production (`package.json`: `npm run db:deploy`)  

### Secrets & bootstrap

- [ ] **`DATABASE_URL`** (production) injected via secret store — not committed  
- [ ] **`METIS_SESSION_SECRET`** unique, high-entropy, rotated with a documented JWT invalidation consequence ([`lib/auth/jwt.ts`](../../lib/auth/jwt.ts): missing secret throws at token mint/verify time)  
- [ ] **`ALLOW_PRODUCTION_DATA_SCRIPT` unset** in production normally — only emergency operator override  
- [ ] **`CLERK_WEBHOOK_SIGNING_SECRET`** (or **`CLERK_WEBHOOK_SECRET`**) for [`POST /api/clerk/webhooks`](../../app/api/clerk/webhooks/route.ts) — must match the signing secret shown in the Clerk Dashboard for that endpoint  

#### Clerk pilot onboarding (webhooks + Metis memberships)

1. Create the Clerk application; set **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** and **`CLERK_SECRET_KEY`** in the app runtime.  
2. Create the Clerk organisation (e.g. Acme). Either let **`organization.created`** create a Metis `Organisation`, or pre-create one in Metis and link ids: `npx tsx scripts/link-clerk-org.ts <metisOrganisationId> <clerkOrgId>`.  
3. In Clerk → **Webhooks**, add **`https://<your-host>/api/clerk/webhooks`**, subscribe at minimum to **`organization.created`**, **`organization.updated`**, **`organization.deleted`**, **`organizationMembership.created`**, **`organizationMembership.updated`**, **`organizationMembership.deleted`**, and optionally **`user.created`** / **`user.updated`**.  
4. Copy the endpoint **signing secret** into **`CLERK_WEBHOOK_SIGNING_SECRET`** (alias **`CLERK_WEBHOOK_SECRET`**).  
5. Invite users in Clerk; after deliveries, confirm Metis **`User`** (by `clerkUserId` / email) and **`Membership`** rows. If an event was missed, repair with `npx tsx scripts/provision-clerk-membership.ts <email> <orgSlugOrId> <Admin|User|Viewer>`.  
6. Sign in via Clerk, confirm the dashboard resolves the correct workspace (`Organisation.clerkOrgId` + active Clerk org), and confirm **`Membership.role`** still governs writes (Viewer read-only).  

### Planned (until implemented)

- [ ] **Clerk** production instance and keys (**SSO bridge + org/membership webhook sync shipped** — configure keys, webhook URL, signing secret; invitation UX / admin UI still **planned** §9)  
- [ ] Outbound **email**/notification provider (**planned**: no SMTP env vars wired in-repo today beyond product intent)  

### Operational

- [ ] **Automated backups** enabled on production Postgres with tested **restore rehearsal** cadence  
- [ ] **Error logging / uptime monitoring** (host-native or APM — product choice); document dashboards and alerting owners  
- [ ] **Incident contact tree** written down (Pager / Slack escalation)  

### Tenant bootstrap

- [ ] **Demo seed deliberately not executed** (`npm run db:seed`)  
- [ ] First **Administrator** provisioned intentionally (today: scripted Prisma bootstrap — §6) — no shared staging credentials  
- [ ] Pilot **organisation** created per **planned** model (today: logically “first customer” tenant = clean DB posture + governance; code-level tenancy **planned**)  

---

## 3. Environment variables (referenced in repo)

Derived from `.env.example`, auth/AI/message routes, and operational scripts — **avoid inventing additional names.**

### Required / critical

| Variable | Role |
|----------|------|
| `DATABASE_URL` | PostgreSQL URL for Prisma ([`schema.prisma`](../../db/prisma/schema.prisma) `env("DATABASE_URL")`). |
| `METIS_SESSION_SECRET` | HMAC signing key for JWT session cookies ([`lib/auth/jwt.ts`](../../lib/auth/jwt.ts)); **missing → runtime failure.** |

> `.env.example` currently omits `METIS_SESSION_SECRET`; production operators must provision it explicitly.

### Recommended for environment clarity & safety

| Variable | Role |
|----------|------|
| `APP_ENV` | `local`, `staging`, or `production` — **strongly recommended** in every long-lived deployment. Demo/destructive scripts consult this plus deployment signals (see §4). |
| `NODE_ENV` | Framework convention; **`production`** in prod builds triggers `Secure` session cookies ([`lib/auth/session.ts`](../../lib/auth/session.ts)). |
| `ALLOW_PRODUCTION_DATA_SCRIPT` | Overrides guard for **`db:seed`** / **`db:clean-validation-users`**. **Treat as red-alert:** `"true"`/`"1"`/`"yes"` case-insensitive. Normally **unset** in production. |

Deployment platform hints read by scripts (document for operators):

| Variable | Role |
|----------|------|
| `VERCEL_ENV` | e.g. `production` refuses demo scripts regardless of benign `APP_ENV` |
| `RAILWAY_ENVIRONMENT` | e.g. `production` same guard behaviour |

### Optional — AI-assisted features (`OPENAI_API_KEY`)

The app gates features per env booleans:

| Variable | Default | Behaviour |
|----------|---------|-----------|
| `OPENAI_API_KEY` | _(unset disables model calls)_ | Required when AI-assisted paths run |
| `OPENAI_MODEL` | code default fallback | Overrides model id |
| `BRIEF_AI_SYNTHESIS_ENABLED` | `"false"` | Must be `"true"` for executive-summary synthesis polish paths ([`lib/ai/synthesizeBrief.ts`](../../lib/ai/synthesizeBrief.ts), brief routes) |
| `MESSAGES_AI_CLEANUP_ENABLED` | `"false"` | Must be `"true"` for Messages optional AI wording cleanup route |
| `NOTES_CAPTURE_AI_ENABLED` | `"false"` | Must be `"true"` for capture-notes extract API |

(Source: [.env.example](../../.env.example) and cited files.)

### One-off provisioning script (operators only)

[`scripts/provision-user.mjs`](../../scripts/provision-user.mjs):

| Variable | Role |
|----------|------|
| `METIS_PROVISION_EMAIL` | Target user email (lowercased by script) |
| `METIS_PROVISION_PASSWORD` | Initial password hashed with bcrypt rounds 12 |
| `METIS_PROVISION_ROLE` | `Viewer`, `Operator`, or `Admin` |

> This script touches **whatever `DATABASE_URL` points at**. Run intentionally from a controlled shell; ideally after guard-friendly `APP_ENV` + DB review.

### Optional smoke tooling

[`scripts/prod-smoke.mjs`](../../scripts/prod-smoke.mjs): `METIS_SMOKE_TIMEOUT_MS`, optional compare UUID envs — QA against **non-production URLs** preferred.

---

## 4. Demo seed safety

| Command | Intent |
|---------|--------|
| `npm run db:seed` | Loads deterministic **demo/fixture issues** via Prisma seed — **`local`/staging/demo only**. |
| `npm run db:clean-validation-users` | Deletes strictly allow-listed QA emails — **dev disposable accounts only.** |

Mechanism: **`assertAllowedNonProductionDataScript`** rejects production-like combos unless `ALLOW_PRODUCTION_DATA_SCRIPT` is deliberately set (`scripts/guards/assertNonProductionDataScript.ts`).

**Production bootstrap ≠ demo seed.** Production onboarding should rely on migrations + provisioning + (**planned**) organisation + (**planned**) IdP onboarding — never `npm run db:seed` against customer-facing production data stores.

---

## 5. Migration process (safe sequence)

1. **Snapshot / backup production** whenever production already holds irreproducible data.  
2. **Apply migrations on staging first** (`npm run db:migrate` in dev workspaces or CI against staging DB — or `prisma migrate deploy` in staging pipelines).  
3. **Smoke-test staging** (`npm run build`, manual flows, optionally `npm run smoke:prod` targeting staging URL pattern).  
4. **Deploy the same artifact/commit tag** promoted from staging gates.  
5. **Run `npm run db:deploy` (≈ `npx prisma migrate deploy`)** against production **`DATABASE_URL`**. Confirm exit success in CI logs / operator transcript.  
6. **Smoke critical routes**: login (`/login`), `/`, issue CRUD skeleton, brief/export surface as applicable — §7 checklist.  

### Explicit don’t

- Prefer **not `prisma db push`** in production — **`migrate deploy`** is drift-safe with migration history tracked in-repo.  
- **`prisma migrate dev`** is for authoring migrations against dev DBs — not CI production apply.

### Rollback expectations

Forwarded-only schema rollbacks remain difficult with SQL migrations; practise **restore-from-backup** if a bad migration slips through. Maintain runbooks with last known-good migration checkpoint.

---

## 6. First organisation onboarding (planned + today’s fallback)

### Target-first-customer narrative (**planned**, multi-tenant + Clerk)

- Create production **organisation** (e.g. “Acme”)  
- Invite **Org Admin** through IdP onboarding  
- Admin invites cohort (e.g. 10 engineers / comms analysts)  
- Assign roles: **Admin**, operator-class **Editor** equivalent → map to **`Operator`**, **Viewer** (see [`packages/shared/src/auth.ts`](../../packages/shared/src/auth.ts): `Viewer` | `Operator` | `Admin` today — refine names when Clerk + org policies arrive)  
- Seed **Audience groups** baseline library  
- Open **first issue**, attach evidence, regenerate **Full** + **Executive** brief rows  
- Compose **messages** exports for pilot channels  

Everything above prefixed with organisational isolation is **planned** until Clerk + tenancy models land — document actual roles with security when shipping.

### What works **today** (single-tenant Postgres)

The schema contains **Issues** usable by any authenticated **`User`** in that DB; there is **no `OrganisationId` FK** tying issues apart.

Bootstrap pattern:

1. Empty production DB (`migrate deploy`; **no demo seed**)  
2. Run **`METIS_PROVISION_*` provisioning** at least once to create **`Admin`** bootstrap user ([`provision-user`](../../scripts/provision-user.mjs))  
3. Log in (`/login` email/password backed by bcrypt — app auth handlers)  
4. Manually create content: Audience groups (`/audience-groups`), first issue workspace, regenerate brief/message/export  

Administrative user CRUD UI is **minimal / out-of-band** (`product/` notes no in-app Wave-7 administration) — plan admin rotation using IdP (**planned Clerk**) or scripted DB updates guarded by SOC process.

---

## 7. Smoke-test checklist — post-deploy production gate

Strike only after purposeful pilot prep — validates **live customer DB** devoid of seeded demo artefacts.

Functional:

- [ ] Login succeeds (`/api/auth/login`)  
- [ ] Dashboard loads `/` lists issues cleanly  
- [ ] Create Issue + minimal fields persists  
- [ ] Audience group create (`Settings → Audience groups`)  
- [ ] Add Source on issue  
- [ ] Add Observation (internal input)  
- [ ] Add Open question (gap tracker)  
- [ ] Generate **full** brief (stores `BriefVersion` full mode)  
- [ ] Generate **executive** brief  
- [ ] Generate **messages** deterministic draft (+ optional polish path if OPENAI_* enabled consciously)  
- [ ] Export full issue brief at least **Markdown / HTML / DOCX** parity offered by UI selectors  
- [ ] Compare revisions (`/compare` version selectors behave)  
- [ ] `/activity` timeline renders plausible operator events  

Environmental:

- [ ] **No seeded demo identifiers** lingering (deterministic seeded issue UUID prefixes `1111…3333`, demo operator label `demo.operator@metis.local` only if someone ran seed inadvertently) — **investigate anomaly**  
- [ ] Demonstrate refusal: **`APP_ENV=production npm run db:seed`** fails before DB mutation (sanity rehearsal in staging mimic)  

---

## 8. Operational safety / governance expectations

### Backups & restore

- Automate RDS/managed Postgres point-in-time or snapshot backups aligned with SLA  
- Quarterly **restore rehearsal** verifying RTO/RPO hypotheses  

### Administrative access hygiene

- **No shared staging credentials** in prod  
- **Break-glass** accounts documented with MFA (**planned Clerk** aligns), periodic access review  

### Deploy authority

Define who merges protected branches vs who rotates secrets — smallest group that can mutate production infra.

### Data access & escalation

Escalations for severity **sev‑1**/P0 leakage paths (credentials exposure, unauthorised export of customer artefacts) rehearsed verbally with legal/comms — document hotline.

### Observation on AI keys

Operational teams must reconcile **MODEL usage logging** externally (vendor dashboards — OpenAI or successor) independently of shipping code.

---

## 9. Known not-yet-implemented / backlog (accuracy guard)

Mark these **planned**, not promised in current UI:

| Item | Note |
|------|------|
| **Clerk** (lifecycle + sync) | **`POST /api/clerk/webhooks`** syncs org + membership events into Metis (see `lib/organisations/clerkOrgSync.ts`); **invitation-only flows** and in-app admin CRUD remain **planned** |
| **`Organisation` / `Membership` parity with Clerk tenants** | Metis **`Membership.role`** remains authoritative for writes; Clerk org roles are **mapped into** Metis on webhook; repair via `scripts/provision-clerk-membership.ts` / `scripts/link-clerk-org.ts` if events are missed |
| **Admin user lifecycle UI** | Provision script + eventual IdP dashboards |
| **Restricted internal observations** | Policy layer beyond schema flags (`excludedFromBrief` exists mechanically) |
| **Approval workflows** | Not surfaced as workflow engine |
| **Conflict detection intelligence** | — |
| **Rich circulation auditing** (`CirculationEvent` exists mechanically but full workflow TBD productisation) |
| **AI help assistant** | Feature class distinct from deterministic brief polish toggles |

Revisit checklist after each roadmap slice ships.

---

## 10. Document maintenance

Owners should refresh this guide when auth or tenancy merges land (Clerk, org tables, email provider bindings). Corrections referencing **actual env names**: grep `process.env` and sync `.env.example` in dedicated PRs when safe.
