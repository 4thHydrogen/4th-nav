# Implementation Plan: 文件夹组件完善 — 全局设置与鼠标位置弹窗

**Branch**: `001-folder-popup-settings` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-folder-popup-settings/spec.md`

**Note**: 用户要求在实现功能的同时，一并修复相关 bug 以确保前端正常工作。

## Summary

完善文件夹组件系统：将列表行高从每个文件夹单独设置改为全局设置；将文件夹展开面板从 inline 展开改为鼠标位置弹出浮动面板（含视口边界检测和贴紧）；预置测试数据；自动删除空文件夹。涉及后端数据模型变更（SiteConfig 新增字段）、前端新组件（FolderPopupPanel）和多个现有组件重构。

## Technical Context

**Language/Version**: Go 1.25.0 (backend) + TypeScript 5.x (frontend)

**Primary Dependencies**:
- Backend: Gin (HTTP), modernc.org/sqlite (SQLite driver)
- Frontend: React 18.2, Vite 8, TanStack React Query 5, Zustand 5, Tailwind CSS 3, Ant Design 5, Framer Motion 12, @dnd-kit (drag & drop)

**Storage**: SQLite (file-based, `data/` directory)

**Testing**: 手动前端测试（用户要求）；后端可选用 `go test`

**Target Platform**: Web 浏览器（桌面端为主）

**Project Type**: Web application (Go backend + React frontend SPA)

**Performance Goals**: 弹窗显示 < 200ms，行高更新 < 1s

**Constraints**: SQLite 单文件数据库，Gin 框架 REST API，前端 SPA 嵌入后端静态资源

**Scale/Scope**: 单用户导航页应用，少量文件夹和条目

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 为模板状态，无自定义原则。跳过 gate 检查。

## Project Structure

### Documentation (this feature)

```text
specs/001-folder-popup-settings/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
# Backend (Go)
database/
├── init.db.go           # Schema + migrations + seed data
├── operations.go        # Query helpers
└── migration.go         # Migration utilities

handler/
└── handlers.go          # All HTTP handlers

service/
├── settings.go          # Global settings CRUD
├── site_config.go       # Site config CRUD (add global folder settings)
├── tools.go             # Tool/folder CRUD + folder settings
└── ...

types/
├── types.go             # Core data structures
└── dto.go               # Request DTOs

# Frontend (React + TypeScript)
ui/src/
├── types/index.ts       # TypeScript interfaces
├── stores/ui.ts         # Zustand UI state
├── queries/index.ts     # React Query hooks
├── components/
│   ├── Content/index.tsx          # Main content container
│   ├── WidgetGrid/index.tsx       # Grid layout + drag & drop
│   ├── WidgetFolder/index.tsx     # Folder widget in grid
│   ├── FolderPopupPanel/          # NEW: Mouse-positioned popup panel
│   │   └── index.tsx
│   ├── InlineFolderPanel/         # TO BE REMOVED or deprecated
│   ├── FolderSettingsPopup/       # TO BE REMOVED
│   ├── FolderItem/index.tsx       # Folder display item
│   ├── ListToolItem/index.tsx     # List mode tool item
│   └── SettingsPopup/             # Global settings (add list item size)
│       └── index.tsx
├── pages/
│   └── Home.tsx
└── utils/
    ├── api.tsx
    └── setting.ts
```

**Structure Decision**: 现有 Go backend + React SPA 架构不变，仅修改现有文件和新增 FolderPopupPanel 组件。删除 FolderSettingsPopup，重构 InlineFolderPanel 为 FolderPopupPanel。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No constitution violations | N/A |
