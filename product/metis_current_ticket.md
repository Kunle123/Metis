# Current ticket: Sprint 0 foundation — issue model, persistence, and seed data

## Objective
Create the initial backend foundation needed to support the dashboard and intake workflow.

## In scope
- full-stack project wiring needed for backend persistence
- database connection
- migration tooling setup
- Issue schema
- create/list/get/update issue endpoints
- shared types/contracts for Issue
- seeded issue examples
- frontend client wiring for listing and opening issues
- dashboard reads real seeded issue data

## Out of scope
- brief generation
- brief version model
- sources
- gaps
- internal input
- compare
- export
- email/note ingestion
- auth beyond the minimum needed to run locally and in one deployed environment
- broad UI redesign

## Acceptance criteria
- the app runs as a real full-stack application
- database migrations run successfully
- Issue records can be created, listed, retrieved, and updated
- seeded issue records can be loaded into the database
- the dashboard renders seeded issues from real backend data
- shared types/contracts exist for Issue request/response shapes
- any assumptions or unresolved schema questions are documented

## Stop and ask if
- Issue should be split into multiple persistence models at this stage
- intake fields clearly require a separate model now rather than later
- a framework or deployment choice would materially affect later architecture
- the existing dashboard UI must change materially to support real data
- any implementation choice would affect product behavior rather than just persistence
- you need to add dependencies not already implied by the current stack

## Implementation notes
- prefer the smallest durable schema that supports dashboard + intake persistence
- keep architecture portable
- do not build future features early
- do not invent auth/permissions behavior
