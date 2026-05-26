# AGENTS.md

## Workflow

This project uses:
- OpenSpec for medium and large requirement changes.
- Direct-edit workflow for small, local, reversible changes.
- Basic Memory only for durable project knowledge.
- Serena only when semantic code navigation is useful.

Spec Kit is retired for this repository. Historical Spec Kit artifacts are archived under `docs/archive/spec-kit/` and must not be treated as the active source of truth unless the user explicitly asks to inspect old history.

## Default: Direct Edit

Use direct edit by default for:
- UI tuning and visual polish.
- Bug fixes.
- Styling experiments.
- Small refactors.
- Changes limited to one feature area.
- Prototype-only work.

Direct-edit workflow:
1. Inspect the relevant files.
2. Make small reversible changes.
3. Run the appropriate verification command when practical.
4. Summarize changed files, why they changed, and how to verify.

Do not create an OpenSpec change for small CSS tweaks, quick visual iteration, isolated bug fixes, or one-off prototypes.

## OpenSpec

Use OpenSpec when a change has durable requirements or meaningful product behavior:
- User-facing behavior changes with acceptance criteria.
- Changes touching multiple modules.
- API, data model, storage, or integration changes.
- Architecture decisions that should remain documented.
- Work that needs reviewable scope before implementation.

OpenSpec structure:
- `openspec/project.md` — project context and workflow policy.
- `openspec/specs/` — current agreed behavior, organized by capability.
- `openspec/changes/` — proposed changes, one folder per change.

For OpenSpec changes, use this shape:
- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>/design.md` when technical approach matters.
- `openspec/changes/<change-id>/tasks.md`
- `openspec/changes/<change-id>/specs/<capability>/spec.md` for requirement deltas.

Keep OpenSpec lightweight. Prefer short proposals and focused requirement deltas over broad planning documents.

## Implementation Rules

- Only implement the task explicitly requested by the user.
- Keep changes small and reversible.
- Do not modify unrelated files.
- Prefer existing architecture and naming conventions.
- Do not add dependencies unless the current request explicitly needs them.
- If old Spec Kit docs conflict with current code or OpenSpec, current code and OpenSpec win.

## Basic Memory Rules

Save only durable knowledge:
- Architecture decisions.
- API conventions.
- Module responsibilities.
- Recurring bugs and fixes.
- Deployment notes.
- Constraints future development must know.

Do not save temporary implementation details, visual tuning attempts, or prototype notes.

## Serena Rules

Use Serena for:
- Finding symbols.
- Finding references.
- Understanding code structure.
- Locating existing implementation patterns.

Do not use Serena memory as the source of truth for architecture decisions.
Basic Memory and OpenSpec are the durable documentation sources.
