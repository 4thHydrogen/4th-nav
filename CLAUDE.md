# CLAUDE.md

## Workflow

This project uses OpenSpec for medium and large requirement changes, and direct edit for everyday implementation work.

Spec Kit is retired. Historical Spec Kit artifacts live under `docs/archive/spec-kit/` and are not active instructions.

## Default Direct-Edit Workflow

Use direct edit for:
- UI tuning and visual polish.
- Bug fixes.
- Styling experiments.
- Small refactors.
- Changes limited to one feature area.
- Prototype-only work.

Steps:
1. Inspect relevant files.
2. Make small reversible changes.
3. Verify with build, test, or targeted manual checks when practical.
4. Summarize changed files, reasons, and verification.

## OpenSpec Workflow

Use OpenSpec only when the work has durable requirements or reviewable scope:
- User-facing behavior changes with acceptance criteria.
- Multi-module changes.
- API, data model, storage, or integration changes.
- Architecture decisions that should remain documented.

OpenSpec files live in:
- `openspec/project.md`
- `openspec/specs/`
- `openspec/changes/`

For change proposals, use:
- `proposal.md` for why and what.
- `design.md` only when the technical approach matters.
- `tasks.md` for implementation checklist.
- `specs/<capability>/spec.md` for requirement deltas.

Keep OpenSpec lightweight. Do not create proposal folders for tiny CSS changes, quick visual iteration, or isolated bug fixes.

## Implementation Rules

- Only implement the task explicitly requested by the user.
- Keep changes small and reversible.
- Do not modify unrelated files.
- Prefer existing architecture and naming conventions.
- Do not add dependencies unless the current request explicitly needs them.

## Basic Memory Rules

Save only durable knowledge:
- Architecture decisions.
- API conventions.
- Module responsibilities.
- Recurring bugs and fixes.
- Deployment notes.
- Constraints future development must know.

Do not save temporary implementation details.

## Serena Rules

Use Serena for:
- Finding symbols.
- Finding references.
- Understanding code structure.
- Locating existing implementation patterns.

Do not use Serena memory as the source of truth for architecture decisions.
Basic Memory and OpenSpec are the durable documentation sources.
