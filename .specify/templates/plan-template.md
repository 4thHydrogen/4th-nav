# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: [e.g., Go 1.26 + TypeScript 5.7]

**Primary Dependencies**: [e.g., Gin, React Query, Zustand, Ant Design]

**Storage**: [e.g., SQLite, localStorage, N/A]

**Testing**: [e.g., go test, tsc --noEmit, vitest, manual browser verification]

**Target Platform**: [e.g., Web SPA + embedded Go server]

**Project Type**: [e.g., single-repo web application]

**Performance Goals**: [domain-specific goals]

**Constraints**: [domain-specific constraints]

**Scale/Scope**: [domain-specific scope]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Does the plan keep runtime contracts on canonical names only?
- Do backend changes respect `handler -> service -> repository -> database`?
- Do frontend changes land in page / feature / shared / entity boundaries rather
  than enlarging a God component?
- If an older path is being replaced, what files/state/routes are deleted in the
  same task to avoid dual tracks?
- What verification commands are required for the touched layers?

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
database/
handler/
repository/
server/
service/
types/
ui/src/
├── components/
├── entities/
├── features/
├── pages/
└── shared/
```

**Structure Decision**: [Describe which directories this feature will touch and
why they match the constitution.]

## Complexity Tracking

> Fill only if a constitutional exception is truly required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., temporary compatibility adapter] | [reason] | [why direct cleanup is impossible in this task] |
