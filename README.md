# Metis

Metis is a corporate comms issue-briefing workspace centered on a source-backed internal brief.

## Repo structure
- `product/` source-of-truth product docs
- `app/` frontend application
- `server/` backend services
- `packages/shared/` shared types/contracts
- `db/` schema and migrations
- `scripts/` utility scripts

## Deploy / pilots

Operational checklist for separating **staging**, **production**, onboarding, migrations, secrets, demo-seed prohibition, *planned* Clerk / org scoping):

- **[Production readiness guide](./docs/deployment/production-readiness.md)**

## First step for Cursor

Read the files in `product/` before making changes.
