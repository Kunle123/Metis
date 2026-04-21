# Metis design guardrails

## Product identity
Metis is a corporate comms issue-briefing workspace centered on a source-backed internal brief.

## Core truths
- The Full Issue Brief is the center of gravity.
- The workspace exists to support, validate, update, and package the brief.
- Evidence and uncertainty must remain visible.
- The product must support circulation-ready outputs.
- The product is not a monitoring dashboard, task manager, workflow engine, or collaboration suite.

## Primary users
- Head of Corporate Communications
- Corporate Affairs lead
- Chief of Staff
- PMO / Transformation lead

## Core workflow
1. Create or open an issue
2. Capture structured intake
3. Generate or update the brief
4. Review evidence and sources
5. Identify gaps
6. Add internal input
7. Compare versions
8. Export circulation artifacts

## Out of scope
Do not add unless explicitly requested:
- automated stakeholder emailing
- inbox sync
- reminders
- routing
- approvals
- task assignment
- Slack/Teams workflow orchestration
- complex permissions
- monitoring-led dashboards
- collaboration-suite behavior

## UX rules
- Prefer direct, production-style language.
- Avoid explanatory/prototype narration.
- Reduce chrome and redundant framing.
- Keep one dominant work surface per screen where possible.
- Keep the Full Issue Brief and Executive Brief artifact-first.
- Preserve calm, serious, internal-tool styling.

## Data and trust rules
- Raw inputs feed the record.
- The record feeds the brief.
- AI may structure, summarize, compare, and suggest.
- Human review is required before uncertain or ingested content changes the durable record.
- Source provenance must remain visible.

## Engineering rules
- Prefer the smallest implementation that satisfies the ticket cleanly.
- Preserve typed contracts and schema discipline.
- Reuse existing patterns and types where possible.
- Do not silently refactor unrelated areas.
- Do not introduce provider lock-in without approval.
- If a missing decision affects UX, workflow, trust, or core data shape, stop and ask.

## Definition of done mindset
A ticket is done when:
- acceptance criteria are met
- scope has not expanded
- product direction has not drifted
- the implementation matches the product docs
- any unresolved questions are surfaced explicitly
