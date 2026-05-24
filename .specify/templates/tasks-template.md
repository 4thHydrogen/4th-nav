---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories),
`research.md`, `data-model.md`, `contracts/`

**Tests**: Include tests only when the spec requires them, but always include the
verification commands required by the touched layers.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., `US1`, `US2`)
- Include exact file paths in descriptions
- If a system is being replaced, include the deletion/cleanup task in the same
  story instead of leaving it for later

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and structural setup

- [ ] T001 Create or update files required by the implementation plan
- [ ] T002 Align configuration or environment scaffolding needed for the feature
- [ ] T003 [P] Record verification commands and affected layers

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user stories

- [ ] T004 Establish shared models, adapters, or migration primitives
- [ ] T005 [P] Update routing, API clients, or state boundaries if required
- [ ] T006 [P] Prepare cleanup targets for any system being replaced

**Checkpoint**: Foundation ready — user story work can begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Brief description]

**Independent Test**: [How to verify this story works on its own]

### Implementation for User Story 1

- [ ] T010 [P] [US1] Update the core files for this story
- [ ] T011 [US1] Wire the feature through the affected layers
- [ ] T012 [US1] Remove replaced code paths, state, or assets
- [ ] T013 [US1] Run required verification commands

**Checkpoint**: User Story 1 is independently functional

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description]

**Independent Test**: [How to verify this story works on its own]

### Implementation for User Story 2

- [ ] T020 [P] [US2] Update the feature-specific files
- [ ] T021 [US2] Integrate with existing entities or services
- [ ] T022 [US2] Remove any superseded implementation
- [ ] T023 [US2] Run required verification commands

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description]

**Independent Test**: [How to verify this story works on its own]

### Implementation for User Story 3

- [ ] T030 [P] [US3] Update the necessary files
- [ ] T031 [US3] Complete integration and cleanup
- [ ] T032 [US3] Run required verification commands

**Checkpoint**: All stories are independently functional

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T100 [P] Update docs and operator-facing guidance
- [ ] T101 Remove dead files and compatibility remnants not already removed
- [ ] T102 Run the full verification set for touched layers

---

## Notes

- Prefer small, file-specific tasks over vague “refactor” tasks
- A migration is not complete until old paths are removed
- If verification cannot run, the blocked command and reason must be recorded
