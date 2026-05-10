# Manual QA notes

Short, internal checklists for exercising Metis behaviours against seeded demo data. For deployment and operational readiness, see `docs/deployment/production-readiness.md`.

---

## Restricted internal observation visibility

### Purpose

- Seeded demo accounts (`visibility.demo.*@metis.local`) exist **only for local/staging QA** against `prisma db seed`.
- **Do not use** these credentials in production or customer environments.
- Demo seed is **blocked from running against production-shaped environments** unless an explicit override is set (`assertAllowedNonProductionDataScript` — see `scripts/guards/assertNonProductionDataScript.ts`). Treat production bootstrap as migrations + your real onboarding path (e.g. Clerk + organisation membership), **not** the demo seed.

### Accounts (demo seed)

| Role (org membership) | Email                                  | Password |
|-----------------------|----------------------------------------|----------|
| Admin                 | `visibility.demo.admin@metis.local`    | `demo`   |
| User (author pattern) | `visibility.demo.user@metis.local`     | `demo`   |
| Viewer                | `visibility.demo.viewer@metis.local`    | `demo`   |

### Test issue

Issue ID (deterministic seeded row):

`22222222-2222-2222-2222-222222222222`

### Manual checks

After `npx prisma db seed`, sign in as each account and confirm:

1. **Admin** — can see **all** observations, including the **Restricted** demo observation (Community Liaison / Noah Singh on that issue).
2. **Author (User)** — can see **their own** restricted observation (same row; seeded as authored by the User demo account).
3. **Viewer** — cannot see that restricted observation in lists, workspace cards, gaps dropdowns, or the internal observations page API/UI (row is omitted).
4. **Non-author (User or Viewer)** — cannot **fetch** a restricted observation by UUID directly: `GET /api/issues/{issueId}/internal-inputs/{internalInputId}` returns **404** (not 403).
5. **Brief / Messages / Export** — as **Viewer**, generate or preview artefacts: content must **not** include the restricted observation’s wording.
6. **Export appendix** (full-issue-brief markdown/HTML) — as **Viewer**, where a resolved open question references a hidden observation line, appendix text should include **“Answered by restricted observation”** rather than OBS detail.
7. **Activity** — as **Viewer**, timeline must **not** show a restricted **`OBS-*`** observation code for internal-input activity when you cannot read that observation (enrichment omits the code).

### Production warning

- These accounts **should not exist** in production databases.
- **Do not** run `prisma db seed` against production.
- Production access should use **Clerk** (or your IdP) and **organisation membership** as implemented in the app — not demo fixtures.
