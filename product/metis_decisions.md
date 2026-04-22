# Metis decisions log

Record only decisions that have actually been made. Do not fill gaps with guesses.

---

## Product decisions

### 1. Product category
Metis is a corporate comms issue-briefing workspace centered on a source-backed internal brief.

### 2. Core artifact
The Full Issue Brief is the primary artifact.
The Executive Brief is a first-class derived mode.
The workspace exists to support the artifact.

### 3. Scope boundaries
Explicitly out of scope unless later approved:
- automated stakeholder emailing
- inbox sync
- reminders
- routing
- approvals
- task assignment
- workflow orchestration
- monitoring-led dashboards
- collaboration-suite behavior

### 4. Clarification model
Metis supports:
- gap detection
- suggested stakeholder roles
- drafted questions
- manual internal input capture

It does not run the communication workflow.

### 5. AI role
AI may:
- generate first-pass briefs
- regenerate selected sections
- compare versions
- suggest gaps
- extract structured candidates from pasted notes/emails

AI should not:
- silently commit uncertain changes
- automate outreach
- replace human review for trust-sensitive updates

### 6. Ingestion direction
Email/note ingestion is user-initiated and review-based.
Raw input is parsed into candidates.
The user reviews and commits selected items.
No mailbox monitoring or autonomous workflow.

### 7. Hosting direction
Default direction: hosted SaaS controlled by the product, with a Railway-first path and portability for later migration if needed.

### 8. Design direction
Metis should feel:
- calm
- serious
- internal
- board-safe
- artifact-first

### 9. Current build order
Build order is:
- platform foundation
- issue model and intake persistence
- brief artifact system
- evidence grounding
- gaps and internal input
- compare and export
- AI-assisted ingestion later

### 10. Access + governance (Wave 7; 2026-04-22)
Metis uses a **minimal, Metis-owned login** (not SSO) to protect a leadership-facing comms workspace:
- Users are stored in Postgres (`User`) with a **global role** (`Viewer | Operator | Admin`).
- Authentication is a **signed HTTP-only session cookie** (`metis_session`) using `METIS_SESSION_SECRET`.
- **All pages and APIs require a logged-in session** (unauthenticated users are directed to `/login` or receive `401` on APIs, except public auth routes under `/api/auth/*`).
- **All logged-in users can read**; **only `Operator` and `Admin` can mutate** durable state (writes are blocked for `Viewer` at the API layer).
- **No in-app user administration in Wave 7**; initial users are provisioned outside the app (seed/SQL/CLI script).

---

## Open decisions

Use this section only for true unresolved questions.

- Initial auth model: single-user first or minimal team mode?
- Exact storage mechanism for attachments and exported artifacts?
- Whether readiness is stored at issue level, brief level, or both in v1?

---

## Implementation notes
When a decision is made:
- add the date
- add the rationale
- add the impact on scope or implementation
