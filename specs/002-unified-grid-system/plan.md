# Implementation Plan: 统一网格系统 — 浮动文件夹窗口与全域拖拽

**Branch**: `002-unified-grid-system` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-unified-grid-system/spec.md`

## Summary

重新设计前端网格系统，使文件夹以浮动窗口展开（替代当前 createPortal 弹窗），浮动窗口内使用与主面板一致的组件和拖拽系统。浮动窗口打开期间主面板完全阻塞。统一展示模式（list/网格）对折叠态和展开态的影响。修复合并创建文件夹位置跳转和尺寸变更重排等现有 bug。

## Technical Context

**Language/Version**: Go 1.25 (backend), TypeScript 5.7 + React 18 (frontend)

**Primary Dependencies**:
- Frontend: `@dnd-kit/core` 6.3, `framer-motion` 12.x, `zustand` 5.x, `@tanstack/react-query` 5.x, `antd` 5.x
- Backend: Gin, modernc.org/sqlite

**Storage**: SQLite (nav_table 表存储所有 tool/folder 条目)

**Testing**: 手动浏览器测试（项目当前无自动化测试框架）

**Target Platform**: Web 浏览器（桌面端为主）

**Project Type**: Web application (Go backend + React SPA frontend)

**Performance Goals**: 动画 300ms 内完成，拖拽响应流畅无卡顿

**Constraints**: dnd-kit hooks 不跨 createPortal 工作（已确认为硬限制）

**Scale/Scope**: 单用户书签导航应用，条目数量级 10-500

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 模板为空（`.specify/memory/constitution.md` 未配置实际原则），无需检查。自动通过。

## Project Structure

### Documentation (this feature)

```text
specs/002-unified-grid-system/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Architecture research
├── data-model.md        # Phase 1: Data model
├── quickstart.md        # Phase 1: Quick start guide
└── tasks.md             # Phase 2: Task breakdown (via /speckit-tasks)
```

### Source Code (repository root)

```text
# Backend (Go)
handler/
  └── handlers.go              # API endpoints
service/
  └── tools.go                 # Business logic
database/
  └── init.db.go               # DB schema & queries
types/
  └── *.go                     # Data types

# Frontend (React + TypeScript)
ui/src/
├── components/
│   ├── WidgetGrid/            # 主网格容器
│   │   ├── index.tsx          # DndContext + 网格渲染
│   │   ├── useGridLayout.ts   # 网格布局算法
│   │   └── useGridDrag.ts     # dnd-kit 拖拽逻辑
│   ├── WidgetTool/            # 网页条目组件
│   │   └── index.tsx
│   ├── WidgetFolder/          # 文件夹折叠态组件
│   │   └── index.tsx
│   ├── FolderFloatingWindow/  # 新: 文件夹浮动窗口
│   │   └── index.tsx
│   ├── ToolContextMenu/       # 右键菜单
│   │   └── index.tsx
│   └── Content/               # 主应用容器
│       └── index.tsx
├── hooks/                     # Shared hooks
├── types/
│   └── index.ts               # TypeScript 类型
└── stores/                    # Zustand stores
```

**Structure Decision**: 保持现有项目结构。新增 `FolderFloatingWindow/` 组件替代当前 `FolderPopupPanel/`。`ToolItem/` 组件将被逐步淘汰，统一使用 `WidgetTool`。

## Implementation Phases

### Phase A: 基础设施 — 布局算法与后端修复

**目标**: 修复底层 bug，为新功能打好基础。

**改动范围**:

1. **后端 `service/tools.go`** — 已在 001 分支修复 gridX/gridY 负值保留问题，需确认合入
2. **后端 `handler/handlers.go`** — MergeToFolderHandler 改为原子操作：一步完成创建+定位+移入
3. **前端 `useGridLayout.ts`** — `buildLayout` 新增碰撞右推逻辑（当前只有碰撞下移）
4. **前端 `useGridLayout.ts`** — `moveItem` 更新碰撞策略：锚定左上角，右推优先

**验收**: 改变组件大小时左上角锚定；合并创建文件夹不跳转

### Phase B: 统一组件 — WidgetTool 全域一致

**目标**: 消除 ToolItem 和 WidgetTool 的差异，所有位置使用同一组件。

**改动范围**:

1. **`WidgetTool/index.tsx`** — 扩展支持 list 渲染模式（当前只支持网格）
2. **`WidgetFolder/index.tsx`** — 折叠态 list 模式改为不截断、可滚动、右下角交互区域
3. **`WidgetFolder/index.tsx`** — 折叠态网格模式子项使用 WidgetTool 渲染（替代当前自定义 ChildIcon）
4. **`ToolItem/index.tsx`** — 标记为 deprecated，后续迭代移除

**验收**: 条目在主面板、文件夹折叠态、文件夹浮动窗口三处外观一致

### Phase C: 浮动窗口 — 替代 FolderPopupPanel

**目标**: 实现新的文件夹浮动窗口，不使用 createPortal，保持在 DndContext DOM 树内。

**改动范围**:

1. **新建 `FolderFloatingWindow/index.tsx`** — 浮动窗口组件
   - 位置：文件夹卡片附近，边界检测靠拢
   - 大小：固定，基于文件夹最大尺寸
   - 内部布局：根据展示模式（list/网格）排列
   - 滚动条：超出最大尺寸时启用
   - 关闭：点击外部或 Esc
   - 主面板阻塞：遮罩层或 pointer-events 控制
2. **`WidgetGrid/index.tsx`** — 集成 FolderFloatingWindow（替代 FolderPopupPanel）
   - 浮动窗口渲染在 DndContext DOM 树内（非 createPortal）
   - 窗口打开时添加遮罩层阻塞主面板交互
3. **`WidgetFolder/index.tsx`** — 点击行为改为打开浮动窗口（替代当前弹窗逻辑）

**验收**: 浮动窗口出现在文件夹附近；主面板被阻塞；窗口内条目与主面板一致

### Phase D: 全域拖拽 — 统一拖拽系统

**目标**: 浮动窗口内拖拽与主面板使用同一 dnd-kit 上下文。

**改动范围**:

1. **`WidgetGrid/index.tsx`** — 调整 DndContext 范围覆盖浮动窗口
2. **`useGridDrag.ts`** — 扩展拖拽逻辑：
   - 浮动窗口内拖出边框松手 → 移至主面板自动排列
   - 浮动窗口内拖拽重排
   - Alt+拖拽合并（窗口内两个条目合并创建新文件夹放主面板）
3. **`FolderFloatingWindow/index.tsx`** — 内部条目使用 dnd-kit useDraggable/useDroppable
4. **后端 `handler/handlers.go`** — MoveToolToFolder 支持从浮动窗口拖出的场景

**验收**: 浮动窗口内拖拽体验与主面板一致；拖出窗口松手条目出现在主面板

### Phase E: 展示模式与边界条件

**目标**: 完善展示模式双向影响和各种边界条件。

**改动范围**:

1. **`WidgetFolder/index.tsx`** — 展示模式切换同时更新折叠态和浮动窗口渲染
2. **`ToolContextMenu/index.tsx`** — 浮动窗口内右键菜单（重命名、删除，不含改大小）
3. **`FolderFloatingWindow/index.tsx`** — 删除最后条目时文件夹动画淡出并移除
4. **边界条件**: 浮动窗口边界检测、窗口缩小时自动关闭、快速连续点击等

**验收**: 展示模式切换即时生效；所有边界条件正确处理

## Dependencies Between Phases

```
Phase A (基础设施)
    ↓
Phase B (统一组件) ← 可与 Phase C 部分并行
    ↓
Phase C (浮动窗口)
    ↓
Phase D (全域拖拽)
    ↓
Phase E (边界条件)
```

## Risk Assessment

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| dnd-kit 不支持跨 DOM 层级的拖拽目标检测 | 高 | 浮动窗口保留在 DndContext DOM 树内（非 createPortal），使用 absolute 定位 |
| 浮动窗口遮挡主面板导致拖拽目标不可见 | 中 | 主面板完全阻塞，不需要看到拖拽目标；拖出即自动排列 |
| buildLayout 碰撞右推逻辑复杂度 | 中 | 分阶段实现：先修复锚定左上角，再加右推，最后处理边界情况 |
| WidgetTool 扩展 list 模式的回归风险 | 低 | 先在 WidgetTool 中添加 viewMode prop，逐步替换 |
