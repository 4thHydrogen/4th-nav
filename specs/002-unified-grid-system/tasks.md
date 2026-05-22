# Tasks: 统一网格系统 — 浮动文件夹窗口与全域拖拽

**Input**: Design documents from `specs/002-unified-grid-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks grouped by user story. 粗粒度，每个任务覆盖一个完整的交付单元。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational — 后端修复与布局算法

**Purpose**: 修复底层 bug，为新功能打好基础。所有后续 Phase 依赖此阶段完成。

- [X] T001 [US4] 后端：MergeToFolderHandler 改为原子操作（一步完成创建+定位+移入），修复 gridX/gridY 负值保留逻辑 — `handler/handlers.go`, `service/tools.go`
- [X] T002 [US4] 布局算法重构：`buildLayout` 和 `moveItem` 新增碰撞右推逻辑（锚定左上角，右侧推移优先，边界则下移） — `ui/src/components/WidgetGrid/useGridLayout.ts`

**Checkpoint**: 改变组件大小时左上角锚定；合并创建文件夹不跳转。可用 quickstart.md Phase A 步骤验证。

---

## Phase 2: US1 — 统一网格组件系统 (P1) 🎯 MVP

**Goal**: 网页条目在任何位置（主面板、文件夹折叠态、浮动窗口）使用相同组件渲染，外观和交互完全一致。

**Independent Test**: 创建条目和文件夹，对比三个位置的条目外观（图标、间距、字体、颜色无差异）。右键菜单一致。

- [X] T003 [US1] 扩展 WidgetTool 支持 list 渲染模式：添加 viewMode prop，list 模式下渲染为行式布局（图标+名称），保持与主面板网格模式相同的交互逻辑（点击、右键、拖拽） — `ui/src/components/WidgetTool/index.tsx`
- [X] T004 [US1] 更新 WidgetFolder 折叠态：网格模式子项统一使用 WidgetTool 渲染（替代当前自定义 ChildIcon）；list 模式不截断全部可滚动，右下角预留交互区域用于点击打开浮动窗口 — `ui/src/components/WidgetFolder/index.tsx`

**Checkpoint**: 条目在主面板和文件夹折叠态外观一致。文件夹折叠态 list 模式全部显示不截断，右下角可点击。

---

## Phase 3: US2 + US5 — 文件夹浮动窗口与展示模式 (P1/P2)

**Goal**: 点击文件夹打开浮动窗口（文件夹卡片附近、边界靠拢），窗口内使用统一展示模式，主面板完全阻塞。

**Independent Test**: 创建 2×2 文件夹（含 6 个条目），点击后浮动窗口出现在卡片附近，主面板不可交互，窗口内条目与主面板一致。切换展示模式（list/网格）后折叠态和窗口同时更新。

- [X] T005 [US2] 新建 FolderFloatingWindow 组件：固定位置（文件夹卡片附近 + 边界靠拢），大小基于文件夹最大尺寸，根据展示模式（list/网格）排列内部条目，超出加滚动条，关闭（点击外部/Esc），主面板遮罩层阻塞 — `ui/src/components/FolderFloatingWindow/index.tsx`, `ui/src/components/FolderFloatingWindow/index.css`
- [X] T006 [US2] 集成浮动窗口到 WidgetGrid：替代 FolderPopupPanel，渲染在 DndContext DOM 树内（非 createPortal），管理打开/关闭状态，处理"文件夹内条目未超容量则不可打开"逻辑 — `ui/src/components/WidgetGrid/index.tsx`, `ui/src/components/Content/index.tsx`
- [X] T007 [US5] 展示模式双向影响：确保文件夹展示模式（list/网格）设置同时影响折叠态渲染和浮动窗口渲染。浮动窗口大小固定不可在窗口内修改。 — `ui/src/components/WidgetFolder/index.tsx`, `ui/src/components/FolderFloatingWindow/index.tsx`

**Checkpoint**: 浮动窗口出现在文件夹卡片附近；主面板阻塞；Esc/点击外部关闭；展示模式双向一致。

---

## Phase 4: US3 — 全域统一拖拽 (P1)

**Goal**: 浮动窗口内拖拽与主面板使用同一 dnd-kit 上下文。拖出窗口边框松手移至主面板自动排列。

**Independent Test**: 打开浮动窗口，拖拽条目到窗口外松手 → 条目出现在主面板。窗口内拖拽重排。Alt+拖拽合并。

- [X] T008 [US3] 统一拖拽系统：浮动窗口内条目使用 Pointer Events 拖出检测，拖出窗口边框松手时自动排列到主面板第一个空位。Alt+拖拽合并创建新文件夹放主面板（禁止嵌套） — `ui/src/components/WidgetGrid/useGridDrag.ts`, `ui/src/components/FolderFloatingWindow/index.tsx`, `ui/src/components/WidgetGrid/index.tsx`

**Checkpoint**: 浮动窗口内拖拽体验与主面板一致。拖出松手条目自动排列到主面板。

---

## Phase 5: US6 + Polish — 折叠态交互与边界条件 (P2)

**Goal**: 完善折叠态条目交互、右键菜单、各种边界条件。

**Independent Test**: 折叠态点击条目打开网页；浮动窗口内右键删除条目；删除最后条目时文件夹淡出；缩小浏览器窗口浮动窗口关闭。

- [X] T009 [US6] 浮动窗口内右键菜单（重命名、删除，不含改大小）；浮动窗口标题栏右键支持 — `ui/src/components/FolderFloatingWindow/index.tsx`
- [X] T010 边界条件处理：浮动窗口边界靠拢检测；窗口缩小时自动关闭；主面板遮罩阻塞 — `ui/src/components/WidgetGrid/index.tsx`, `ui/src/components/FolderFloatingWindow/index.tsx`

**Checkpoint**: 所有边界条件正确处理。可用 quickstart.md Phase E 步骤逐项验证。

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Foundational)
    ↓
Phase 2 (US1 统一组件)
    ↓
Phase 3 (US2+US5 浮动窗口) ← 依赖 Phase 2 的统一组件
    ↓
Phase 4 (US3 拖拽) ← 依赖 Phase 3 的浮动窗口
    ↓
Phase 5 (US6+Polish)
```

### Within Each Phase

- Phase 1: T001 和 T002 可并行（后端和前端不同文件）
- Phase 2: T003 先完成，T004 依赖 T003（需要 WidgetTool 的 list 模式）
- Phase 3: T005 先完成组件，T006 集成，T007 展示模式
- Phase 4: T008 依赖 Phase 3 完成
- Phase 5: T009 和 T010 可并行

### MVP Scope

完成 Phase 1 + Phase 2 + Phase 3 即可交付基础 MVP（统一组件 + 浮动窗口 + 展示模式）。Phase 4（拖拽）和 Phase 5（边界条件）为增量交付。

---

## Implementation Strategy

### MVP First (Phase 1-3)

1. Phase 1: 修复后端 bug + 布局算法
2. Phase 2: 统一 WidgetTool 组件
3. Phase 3: 浮动窗口 + 展示模式
4. **STOP and VALIDATE**: 用 quickstart.md Phase A-C 验证

### Incremental Delivery

1. Phase 1-3 → MVP（统一组件 + 浮动窗口）
2. + Phase 4 → 完整拖拽
3. + Phase 5 → 所有边界条件

---

## Notes

- 共 10 个任务，按 5 个 Phase 组织
- Phase 3 的新建 FolderFloatingWindow 是最大的单任务（新组件 + CSS）
- T008 统一拖拽系统是最复杂的技术挑战（dnd-kit 跨区域拖拽）
- 可在 Phase 3 完成后暂停交付 MVP
