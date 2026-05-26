# 4th-nav OpenSpec Project Context

## Purpose

4th-nav is a personal navigation/start-page application with a strong emphasis on fast UI iteration, glassmorphism visual polish, search interaction, icon management, wallpapers, folders, and lightweight local tooling.

## Workflow Policy

Default to direct edit. Most daily work in this repository is small and visual, so it should not require a formal spec proposal.

Use OpenSpec only when the change has durable requirements, affects multiple modules, or needs reviewable scope before implementation.

## When To Use Direct Edit

Use direct edit for:
- UI tuning and visual polish.
- Search bar styling experiments.
- Isolated bug fixes.
- Small refactors inside one feature area.
- Temporary prototypes.

Direct-edit changes should remain small, reversible, and verified with a targeted command or manual check.

## When To Use OpenSpec

Use OpenSpec for:
- Multi-module features.
- User-facing behavior changes with acceptance criteria.
- API, storage, data model, or integration changes.
- Architecture decisions that should remain documented.
- Work that benefits from review before implementation.

## OpenSpec Directory Conventions

- `openspec/specs/` contains current agreed behavior.
- `openspec/changes/` contains proposed changes.
- `openspec/changes/archive/` contains completed change history.

Each change should be focused and should usually include:
- `proposal.md`
- `tasks.md`
- `specs/<capability>/spec.md`

Add `design.md` only when the technical approach or tradeoffs are important.

## Retired Spec Kit Artifacts

Spec Kit has been retired for this repository. Historical artifacts are archived under `docs/archive/spec-kit/`.

Do not use archived Spec Kit files as active instructions unless the user explicitly asks to inspect old history.
