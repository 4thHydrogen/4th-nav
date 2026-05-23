# 4th Nav Architecture Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the project's engineering baseline and module boundaries so frontend and backend can evolve together without recurring cross-module regressions.

**Architecture:** This remediation uses a vertical-slice approach. We first restore a reliable build, static asset, and migration baseline, then refactor each business domain end-to-end across backend handlers/services/repositories and frontend API/features until legacy paths can be deleted.

**Tech Stack:** Go, Gin, SQLite, React 18, Vite, TypeScript, Zustand, TanStack Query, Ant Design, Vitest

---

## Scope

This plan covers the full-stack remediation needed to stabilize the current codebase while preserving the existing product surface:

- Build and static asset pipeline
- Database initialization and migrations
- Backend layering for tool, folder, icon, layout, settings, dock, and search-engine domains
- Frontend API, state, overlay, folder, layout, and settings systems
- Legacy naming and compatibility cleanup
- Regression-focused automated verification

## Working Rules

- Keep the app runnable after every completed task group.
- Prefer replacing one complete vertical slice over partially touching many slices.
- Delete unused compatibility code as soon as the replacement is verified.
- Add tests around high-regression behavior before deep rewrites.
- Do not add product features during remediation unless required to preserve current behavior.

## Current Risk Snapshot

- Go root package depends on an embedded static directory that does not match the Vite output directory.
- Frontend overlay and folder interactions exist in multiple forms (`OverlayLayer`, `FolderFloatingWindow`, `FolderOverlay`, store remnants).
- API access is split across compatibility re-exports and newer shared API modules.
- The settings screen mixes unrelated domains in one large component.
- Tool, icon, and layout responsibilities are spread across large backend services and handlers.
- Legacy naming (`catelog`) has leaked into DB schema, DTOs, routes, frontend types, and tests.

## Target Architecture

### Backend

- `bootstrap/`: application startup, config loading, static file wiring
- `database/`: connection setup and versioned migrations only
- `repository/`: SQL access per domain
- `service/`: business orchestration per domain
- `handler/`: HTTP request/response only
- `jobs/`: background workers such as icon refresh jobs
- `types/` or `domain/`: stable domain and DTO definitions

### Frontend

- `app/`: router, providers, startup, top-level styles
- `pages/`: route entry points only
- `features/`: domain-specific UI + query hooks + mutations
- `entities/`: shared business entities and adapters
- `shared/`: HTTP client, reusable hooks, base UI, utilities

## File Structure Map

### Documents to create or maintain

- Create: `docs/superpowers/plans/2026-05-23-4th-nav-architecture-remediation.md`
- Create: `docs/architecture/target-structure.md`
- Create: `docs/architecture/domain-slices.md`
- Create: `docs/architecture/regression-checklist.md`

### Backend files likely to change

- Modify: `main.go`
- Modify: `server/static.go`
- Modify: `server/router.go`
- Modify: `database/init.db.go`
- Modify: `database/migration.go`
- Modify: `handler/tool.go`
- Modify: `handler/setting.go`
- Modify: `handler/public.go`
- Modify: `service/tools.go`
- Modify: `service/image.go`
- Modify: `service/icon_discovery.go`
- Modify: `service/icon_job.go`
- Add: `repository/tool_repository.go`
- Add: `repository/folder_repository.go`
- Add: `repository/icon_repository.go`
- Add: `repository/setting_repository.go`
- Add: `service/layout_service.go`
- Add: `service/folder_service.go`
- Add: `jobs/icon_refresh_job.go`

### Frontend files likely to change

- Modify: `ui/vite.config.ts`
- Modify: `ui/src/App.tsx`
- Modify: `ui/src/stores/ui.ts`
- Modify: `ui/src/queries/index.ts`
- Modify: `ui/src/utils/api.ts`
- Modify: `ui/src/shared/api/tool.ts`
- Modify: `ui/src/components/WidgetGrid/index.tsx`
- Modify: `ui/src/components/WidgetGrid/useGridLayout.ts`
- Modify: `ui/src/components/FolderFloatingWindow/index.tsx`
- Modify: `ui/src/components/SearchBar/index.tsx`
- Modify: `ui/src/components/ToolContextMenu/index.tsx`
- Modify: `ui/src/pages/admin/tabs/Setting.tsx`
- Add: `ui/src/features/settings/`
- Add: `ui/src/features/folder-system/`
- Add: `ui/src/features/icon-management/`
- Add: `ui/src/features/layout-system/`
- Delete after migration: `ui/src/components/FolderOverlay/`
- Delete after migration: unused `DesktopCategorySection` if confirmed dead

### Tests to expand

- Modify: `ui/src/__tests__/useFloatingPanel.test.ts`
- Modify: `ui/src/__tests__/ui-store.test.ts`
- Add: `ui/src/__tests__/layout-system.test.ts`
- Add: `ui/src/__tests__/folder-system.test.tsx`
- Add: `ui/src/__tests__/settings-panels.test.tsx`
- Add: `database/migration_test.go`
- Add: `service/icon_job_test.go`

## Task 1: Establish the Engineering Baseline

**Files:**
- Modify: `main.go`
- Modify: `server/static.go`
- Modify: `ui/vite.config.ts`
- Modify: `Makefile`
- Create: `public/index.html` (temporary compile-safe placeholder if needed)
- Test: `go test ./...`
- Test: `corepack pnpm build`

- [ ] Audit the current build/output mismatch between Vite output and Go embed usage.
- [ ] Make frontend build output land in the directory consumed by the Go binary, or make Go consume the directory Vite actually builds.
- [ ] Ensure the embedded path exists in-repo so `go test ./...` does not fail before any business logic runs.
- [ ] Update local build commands so backend and frontend developers use the same expected paths.
- [ ] Run the smallest possible verification loop for both backend compile/test and frontend build.

## Task 2: Introduce a Real Migration Path

**Files:**
- Modify: `database/init.db.go`
- Modify: `database/migration.go`
- Add: `database/migrations.go`
- Test: `database/migration_test.go`

- [ ] Move schema evolution logic out of the giant initialization function into explicit ordered migration steps.
- [ ] Add schema version tracking.
- [ ] Preserve all current columns and seed behavior.
- [ ] Add regression tests covering fresh DB creation and upgrade from an older schema shape.

## Task 3: Split the Backend Tool Domain

**Files:**
- Modify: `handler/tool.go`
- Modify: `service/tools.go`
- Add: `repository/tool_repository.go`
- Add: `service/tool_service.go`
- Test: `service/tool_service_test.go`

- [ ] Extract raw SQL from `service/tools.go` into a repository.
- [ ] Keep handler logic limited to binding, validation, and HTTP response translation.
- [ ] Move tool creation/update/delete behavior into a dedicated service.
- [ ] Preserve folder-related behavior until the folder slice is extracted.

## Task 4: Split the Backend Folder and Layout Domains

**Files:**
- Modify: `handler/tool.go`
- Modify: `service/tools.go`
- Add: `repository/folder_repository.go`
- Add: `service/folder_service.go`
- Add: `service/layout_service.go`
- Test: `service/layout_service_test.go`

- [ ] Separate folder membership operations from generic tool operations.
- [ ] Separate grid layout persistence and validation from tool CRUD.
- [ ] Add tests around move-to-folder, move-out, folder deletion modes, and empty payload rejection.

## Task 5: Normalize the Icon Domain End-to-End

**Files:**
- Modify: `handler/tool.go`
- Modify: `handler/public.go`
- Modify: `service/image.go`
- Modify: `service/icon_discovery.go`
- Modify: `service/icon_job.go`
- Add: `repository/icon_repository.go`
- Add: `jobs/icon_refresh_job.go`
- Test: `service/icon_job_test.go`

- [ ] Separate icon discovery, icon cache, and icon job orchestration.
- [ ] Make status updates flow through a single repository path.
- [ ] Keep `/api/img` cache fill behavior but isolate it from generic image helpers.
- [ ] Add tests around job status transitions and failure handling.

## Task 6: Collapse Frontend API Access to One Pattern

**Files:**
- Modify: `ui/src/utils/api.ts`
- Modify: `ui/src/shared/api/tool.ts`
- Modify: `ui/src/shared/api/content.ts`
- Modify: `ui/src/shared/api/category.ts`
- Modify: `ui/src/shared/api/folder.ts`
- Modify: `ui/src/queries/index.ts`
- Test: `ui/src/__tests__/content.test.ts`

- [ ] Pick one public import path for API functions and make all consumers converge on it.
- [ ] Stop new code from importing through compatibility shims.
- [ ] Move data-shape adaptation close to the API layer instead of spreading it into components.
- [ ] Add regression tests for transformed content payloads.

## Task 7: Rebuild Overlay and Folder Interactions as One System

**Files:**
- Modify: `ui/src/stores/ui.ts`
- Modify: `ui/src/components/WidgetGrid/index.tsx`
- Modify: `ui/src/components/FolderFloatingWindow/index.tsx`
- Modify: `ui/src/components/SearchBar/index.tsx`
- Modify: `ui/src/components/ToolContextMenu/index.tsx`
- Delete: `ui/src/components/FolderOverlay/index.tsx`
- Test: `ui/src/__tests__/useFloatingPanel.test.ts`
- Test: `ui/src/__tests__/folder-system.test.tsx`

- [ ] Remove stale folder-open state from the global store once the overlay path is unified.
- [ ] Make folder open/close, outside click, and escape behavior use one overlay contract.
- [ ] Audit remaining portal-based UI so z-index and close semantics are consistent.
- [ ] Delete dead folder overlay implementations after verification.

## Task 8: Split the Settings Screen into Domain Panels

**Files:**
- Modify: `ui/src/pages/admin/tabs/Setting.tsx`
- Add: `ui/src/features/settings/UserSettingsPanel.tsx`
- Add: `ui/src/features/settings/SiteSettingsPanel.tsx`
- Add: `ui/src/features/settings/WallpaperSettingsPanel.tsx`
- Add: `ui/src/features/settings/IconManagementPanel.tsx`
- Add: `ui/src/features/settings/LayoutSettingsPanel.tsx`
- Test: `ui/src/__tests__/settings-panels.test.tsx`

- [ ] Extract one panel per domain with local hooks.
- [ ] Remove direct polling and side-effect clutter from the page container.
- [ ] Keep behavior unchanged while making each section independently testable.

## Task 9: Rename Legacy Domain Language

**Files:**
- Modify: backend DTOs, types, routes, frontend types, API modules, tests
- Test: affected backend and frontend suites

- [ ] Add a controlled migration path from `catelog` to `category`.
- [ ] Update canonical routes and types first, compatibility aliases second, removals last.
- [ ] Ensure DB compatibility remains intact until all callers are migrated.

## Task 10: Final Regression Net and Cleanup

**Files:**
- Modify: relevant test suites
- Create: `docs/architecture/regression-checklist.md`

- [ ] Run full backend and frontend verification on the remediated structure.
- [ ] Delete compatibility helpers, dead components, and no-longer-used legacy paths.
- [ ] Document the new boundaries and regression checklist for future contributors.

## Recommended Execution Order

1. Task 1: Establish the Engineering Baseline
2. Task 2: Introduce a Real Migration Path
3. Task 3: Split the Backend Tool Domain
4. Task 4: Split the Backend Folder and Layout Domains
5. Task 5: Normalize the Icon Domain End-to-End
6. Task 6: Collapse Frontend API Access to One Pattern
7. Task 7: Rebuild Overlay and Folder Interactions as One System
8. Task 8: Split the Settings Screen into Domain Panels
9. Task 9: Rename Legacy Domain Language
10. Task 10: Final Regression Net and Cleanup

## Self-Review

### Spec coverage

- Active icon, wallpaper, and overlay specs are all represented in the task list.
- The cross-cutting build, migration, naming, and verification work that the active feature plans do not cover is explicitly added here because it blocks safe execution.

### Placeholder scan

- No `TODO`, `TBD`, or "similar to previous task" placeholders remain.
- Each task names specific files and expected responsibilities.

### Type consistency

- This plan consistently uses `tool`, `folder`, `layout`, `icon`, `settings`, and `category` as domain slices.
- Legacy `catelog` is referenced only as cleanup debt, not as a target-state name.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-23-4th-nav-architecture-remediation.md`.

Execution will proceed inline from Task 1, starting with the engineering baseline and static asset pipeline.
