<!--
Sync Impact Report
- Version change: 1.0.0 -> 2.0.0
- Modified principles:
  - Legacy implementation-specific rules -> "I. Canonical Contracts First"
  - Legacy migration rule -> "II. Layered Backend Boundaries"
  - Legacy state rule -> "III. Feature-Oriented Frontend"
  - Legacy parameter rule -> "IV. Complete Migrations, No Dual Tracks"
  - Legacy overlay rule -> "V. Unified Visual System and Verification"
- Added sections:
  - Additional Constraints
  - Delivery Workflow
- Removed sections:
  - Overlay-specific development constraints
- Templates requiring updates:
  - [x] .specify/templates/plan-template.md
  - [x] .specify/templates/spec-template.md
  - [x] .specify/templates/tasks-template.md
  - [ ] .specify/templates/commands/*.md (directory not present)
- Follow-up TODOs:
  - None
-->

# 4th-nav Constitution

## Core Principles

### I. Canonical Contracts First
All runtime-facing contracts MUST use the canonical domain language of the
current system. Public API responses, frontend page models, and admin forms MUST
prefer `category`, `description`, `folderTint`, and `enableSurfaceEffects`
instead of legacy names. Compatibility code is allowed only in database
migrations, explicit adapter layers, or short-lived import/export boundaries.

Rationale: the project became hard to maintain when old and new field names
coexisted across handlers, components, tests, and CSS. The system stays
understandable only when the live path speaks one language.

### II. Layered Backend Boundaries
Backend code MUST preserve the `handler -> service -> repository -> database`
boundary. Handlers own HTTP concerns only. Services own orchestration, business
rules, and task coordination. Repositories own SQL. The `database/` package owns
schema initialization and migrations only.

Rationale: direct SQL in handlers and services made small changes cascade across
the codebase. Clear layering keeps behavior, storage, and transport concerns
isolated and easier to change safely.

### III. Feature-Oriented Frontend
Frontend code MUST keep page composition, feature workflows, shared utilities,
and entity adapters separate. Pages compose features. Features own workflows and
UI slices. Shared modules hold reusable UI, tokens, hooks, and API clients.
Entity adapters normalize transport data before it reaches page-level UI.
Server-state belongs in React Query; transient UI state belongs in Zustand or
local component state.

Rationale: the project became fragile when giant components consumed raw API
payloads directly and mixed layout, folder, overlay, and toolbar concerns.

### IV. Complete Migrations, No Dual Tracks
When replacing an implementation, the same task MUST remove the old entry
points, old state, dead CSS, and obsolete files unless a short-lived bridge is
strictly required. Such bridges MUST be isolated and named as compatibility
layers, not left embedded inside normal runtime code.

Rationale: half-finished migrations were the main source of regressions and
"fix one place, break another" behavior. Cleanup is part of the feature, not a
follow-up aspiration.

### V. Unified Visual System and Verification
All new or modified UI MUST consume the shared token and surface system before
introducing component-local colors, blur values, spacing, or radii. When a CSS
file grows large, it SHOULD be split into shell/content/state modules rather than
kept as a monolith. Every completed change MUST be verified with the project's
standard commands for the touched layers.

Rationale: ad hoc visual values and oversized style files made the UI drift and
slowed routine maintenance. Shared tokens and disciplined verification keep the
interface consistent and lower-risk.

## Additional Constraints

- Project-owned workflow files such as `.specify/` MUST remain versioned. Local
  assistant guidance and caches such as `.agents/`, `AGENTS.md`, `.codex/`,
  `.claude/`, `.tmp/`, and `.serena/cache/` SHOULD remain unversioned unless the
  team explicitly adopts them as shared tooling.
- The frontend build output is the repository-root `public/` directory. Vite,
  Docker, Makefile, and Go `embed` wiring MUST agree on that output path.
- Public-facing docs and runtime messages MUST be readable and free of encoding
  corruption. Broken text in README files, startup flags, admin copy, or handler
  messages counts as a quality defect.
- Dead components, unused folders, and abandoned compatibility shells MUST be
  removed once they are no longer referenced.

## Delivery Workflow

1. Read the relevant spec, plan, and local guidance before modifying code.
2. Keep changes scoped and reversible, but finish the migration you start.
3. If a change affects public contracts, update the corresponding adapters,
   forms, tests, and docs in the same task.
4. Required verification:
   - Frontend/source changes: `ui/node_modules/.bin/tsc.cmd --noEmit -p ui/tsconfig.json`
   - Backend/source changes: `go test ./...`
   - Build chain, embed path, or deployment changes: `corepack pnpm build`
5. If a verification step cannot run because of environment limits, document the
   exact missing proof rather than implying success.

## Governance

This constitution overrides conflicting local habits and historical patterns.
Every plan, task list, and implementation review MUST check for compliance.

Amendment policy:
- MAJOR: redefine or replace a principle, or change governance in a breaking way
- MINOR: add a principle or materially expand a required practice
- PATCH: clarifications, wording cleanup, or non-semantic refinements

Compliance expectations:
- Plans MUST call out any constitutional tension before implementation starts.
- Tasks that replace an older system MUST include cleanup and removal work.
- Reviews SHOULD block changes that reintroduce dual-track contracts, layer
  violations, or unverified build/deploy changes.

**Version**: 2.0.0 | **Ratified**: 2026-05-23 | **Last Amended**: 2026-05-24
