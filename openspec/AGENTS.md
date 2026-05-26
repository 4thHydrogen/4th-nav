# OpenSpec Instructions

Use this directory only for durable product and architecture requirements.

## Direct Edit First

Do not create OpenSpec changes for:
- Small CSS or UI tuning.
- One-off visual experiments.
- Isolated bug fixes.
- Prototype-only work.

For those, use the repository-level direct-edit workflow in `AGENTS.md`.

## Change Structure

When OpenSpec is warranted, create:

```text
openspec/changes/<change-id>/
├── proposal.md
├── tasks.md
└── specs/
    └── <capability>/
        └── spec.md
```

Add `design.md` only when technical approach, tradeoffs, or architecture need review.

## Spec Delta Format

Use concise requirement deltas:

```md
## ADDED Requirements

### Requirement: <name>
The system SHALL ...

#### Scenario: <name>
- WHEN ...
- THEN ...
```

Supported sections:
- `## ADDED Requirements`
- `## MODIFIED Requirements`
- `## REMOVED Requirements`
- `## RENAMED Requirements`

Keep deltas focused on behavior, not implementation notes.
