# Metis open questions

Use this file for unresolved decisions that require product/technical confirmation.

## Current open questions
- Initial auth model: single-user first or minimal team mode?
- Where should readiness state live in v1: issue, brief version, or both?
- How should attachments be stored in the first production deployment?
- Which export formats are required in the first demoable release?
- Should the first AI boundary be a single orchestration service or feature-specific services?

## Rule
If an implementation choice would materially affect:
- product behavior
- user workflow
- trust/provenance
- data model shape
- deployment architecture

add it here and ask before proceeding.
