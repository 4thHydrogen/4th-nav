# Tasks: 文件夹组件完善 — 全局设置与鼠标位置弹窗

**Input**: Design documents from `/specs/001-folder-popup-settings/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 用户要求手动前端测试，不包含自动化测试任务。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 现有项目，无需额外初始化

无需 setup 任务，项目已存在且可编译运行。

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 后端数据模型变更 + 前端类型更新，所有 user story 的前置依赖

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] 在 SiteConfig Go struct 中新增 `FolderListItemSize int` 字段 in `types/types.go`
- [x] T002 [P] 在 `database/init.db.go` 中添加 `folder_list_item_size` 列迁移（ALTER TABLE nav_site_config ADD COLUMN folder_list_item_size INTEGER NOT NULL DEFAULT 28）
- [x] T003 更新 `service/site_config.go` 的 GetSiteConfig 和 UpdateSiteConfig 函数处理新字段
- [x] T004 [P] 更新 `types/dto.go` 中的 SiteConfig 相关 DTO（如有）
- [x] T005 [P] 在前端 TypeScript 接口 `ui/src/types/index.ts` 的 SiteConfig 中新增 `folderListItemSize: number`
- [x] T006 后端编译验证：`go build ./...` 确认所有变更编译通过

**Checkpoint**: 后端 SiteConfig 支持全局列表行高字段，前端类型已同步

---

## Phase 3: User Story 4 - 测试数据填充 (Priority: P1) 🎯 MVP 前置

**Goal**: 后端启动时自动创建测试文件夹和网页条目，确保前端有内容可见

**Independent Test**: 删除 data/ 目录下数据库文件，重启后端，打开前端页面，确认能看到测试数据

### Implementation for User Story 4

- [x] T007 [US4] 在 `database/init.db.go` 的 `initDefaultData` 函数中添加种子数据：3 个测试文件夹（常用工具、学习资源、社交媒体）和 9 个网页条目 + 2 个独立条目（Gmail, Notion），仅在 nav_table 为空时插入
- [x] T008 [US4] 验证种子数据：删除 data/*.db，重启后端，调用 GET /api/tool 确认返回测试数据

**Checkpoint**: 前端打开后有内容可交互

---

## Phase 4: User Story 1 - 全局统一列表行高 (Priority: P1)

**Goal**: 将列表行高从每个文件夹单独设置改为全局设置面板统一控制

**Independent Test**: 在设置面板修改行高滑块，验证所有列表模式文件夹行高同步变化

### Implementation for User Story 1

- [x] T009 [US1] 在 `ui/src/queries/index.ts` 中确认 useContentQuery 返回的 siteConfig 包含 folderListItemSize 字段
- [x] T010 [US1] 修改 `ui/src/components/WidgetFolder/index.tsx`：将 `folder.folderItemSize || 28` 替换为从 siteConfig 读取 `folderListItemSize`
- [x] T011 [US1] 确认 `ui/src/components/ListToolItem/index.tsx` 接收的 itemSize prop 来源已切换为全局设置
- [x] T012 [US1] 在全局设置面板中添加列表行高滑块控件（range 20-60px），调用 useUpdateSiteConfig mutation 保存
- [x] T013 [US1] 移除 `ui/src/components/FolderSettingsPopup/index.tsx` 中的行高滑块（保留 viewMode 切换以备后续移除）
- [x] T014 [US1] 更新 `ui/src/queries/index.ts` 中 useUpdateFolderSettings mutation，移除 folderItemSize 参数

**Checkpoint**: 全局行高设置生效，所有文件夹列表模式行高统一受控

---

## Phase 5: User Story 2 - 鼠标位置弹出文件夹面板 (Priority: P1) + User Story 3 - 条目直接点击 (Priority: P2)

**Goal**: 点击文件夹在鼠标位置弹出浮动面板，支持视口边界贴紧；面板内条目可直接点击导航

**Independent Test**: 点击文件夹 → 弹窗出现在鼠标附近 → 靠边时贴紧 → 点击条目新标签页打开 → 点击外部或 Esc 关闭

### Implementation for User Story 2 + US3

- [x] T015 [US2] 新建 `ui/src/components/FolderPopupPanel/index.tsx`：创建弹出面板组件框架（props: folder, children, mouseX, mouseY, listItemSize, onClose, onOpenTool, siteConfig）
- [x] T016 [US2] 在 FolderPopupPanel 中实现定位算法：基于 mouseX/mouseY 计算初始位置，检测四个方向的视口边界溢出，自动贴紧，使用 `position: fixed`
- [x] T017 [US2] 在 FolderPopupPanel 中实现内容渲染：grid 模式使用 FolderItem 组件，list 模式使用 ListToolItem 组件，最大高度 `min(contentHeight, viewportHeight * 0.7)` 超出时内部滚动
- [x] T018 [US2] 在 FolderPopupPanel 顶部添加 view mode 切换按钮（grid/list 图标），调用 useUpdateFolderSettings 更新 folderViewMode
- [x] T019 [US2] 实现关闭逻辑：点击面板外部区域关闭、Esc 键关闭、点击另一个文件夹时关闭当前面板并打开新面板
- [x] T020 [P] [US2] 添加 FolderPopupPanel 样式文件 `ui/src/components/FolderPopupPanel/index.css`（如需要），包含毛玻璃效果、阴影、动画
- [x] T021 [US2] 更新 `ui/src/stores/ui.ts`：新增 popupPanel 状态（visible, folderId, mouseX, mouseY）及对应 actions
- [x] T022 [US2] 修改 `ui/src/components/WidgetGrid/index.tsx`：在文件夹点击事件中记录鼠标坐标，触发 popupPanel 状态更新，渲染 FolderPopupPanel via Portal
- [x] T023 [US2] 修改 `ui/src/components/WidgetFolder/index.tsx`：文件夹点击时传递鼠标事件坐标给 WidgetGrid
- [x] T024 [US3] 确认 FolderPopupPanel 内所有工具条目点击后通过 `window.open(url, '_blank')` 打开新标签页

**Checkpoint**: 弹出面板在鼠标位置显示，边界贴紧，条目可点击导航，Esc/点击外部关闭

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 清理旧组件、修复相关 bug、确保前端正常工作

- [x] T025 删除 `ui/src/components/FolderSettingsPopup/` 目录（视图模式切换已移至 FolderPopupPanel）
- [x] T026 删除 `ui/src/components/InlineFolderPanel/` 目录（已被 FolderPopupPanel 替代）
- [x] T027 清理 WidgetGrid 中对 InlineFolderPanel 的所有引用和导入
- [x] T028 在 `service/tools.go` 的 DeleteTool 函数中添加空文件夹检测：删除条目后检查其 parentId 对应的文件夹是否还有子条目，若无则级联删除该文件夹
- [x] T029 前端处理空文件夹自动删除：React Query 删除条目后 refetch 数据，确认空文件夹从 UI 中移除
- [x] T030 修复 WidgetFolder 在 list 模式下使用全局行高时的布局计算（如果 WidgetFolder 的预览区仍依赖 itemSize 计算可见条目数）
- [ ] T031 端到端手动验证：启动前后端，测试完整流程（打开页面→看到测试数据→点击文件夹→弹窗定位→切换模式→点击条目→修改全局行高→删除条目触发空文件夹清理）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无需操作
- **Foundational (Phase 2)**: 立即开始 - BLOCKS all user stories
- **User Story 4 (Phase 3)**: 依赖 Phase 2 完成，提供测试数据
- **User Story 1 (Phase 4)**: 依赖 Phase 2 完成，可与 Phase 3 并行
- **User Story 2+3 (Phase 5)**: 依赖 Phase 4 完成（需要全局行高设置就绪）
- **Polish (Phase 6)**: 依赖 Phase 5 完成

### User Story Dependencies

- **US4 (P1)**: 仅依赖 Foundational — 提供测试数据
- **US1 (P1)**: 仅依赖 Foundational — 可与 US4 并行
- **US2 (P1)**: 依赖 US1（需要全局行高值传入 FolderPopupPanel）
- **US3 (P2)**: 与 US2 紧耦合（条目点击在弹窗内）
- **Polish**: 依赖所有 user stories 完成

### Within Each User Story

- 后端 schema 变更先于前端类型更新
- 类型更新先于组件实现
- 组件实现先于集成
- 集成完成后验证

### Parallel Opportunities

- T001 + T002 + T004 + T005: 后端类型/迁移 + 前端类型（不同文件，可并行）
- Phase 3 (US4) 和 Phase 4 (US1) 可并行执行
- T020 (样式文件) 可与 T015-T019 并行

---

## Parallel Example: Foundational Phase

```bash
# 同时启动不相关的基础任务:
Task T001: "SiteConfig struct 新增字段 in types/types.go"
Task T002: "添加数据库迁移 in database/init.db.go"
Task T004: "更新 DTO in types/dto.go"
Task T005: "更新前端 TypeScript 类型 in ui/src/types/index.ts"
```

## Parallel Example: User Story 2

```bash
# 同时启动不相关的弹窗任务:
Task T015: "创建 FolderPopupPanel 组件框架"
Task T020: "添加 FolderPopupPanel 样式文件"
```

---

## Implementation Strategy

### MVP First (Test Data + Global Settings)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US4 (测试数据)
3. Complete Phase 4: US1 (全局行高)
4. **STOP and VALIDATE**: 打开前端，确认能看到测试数据，行高设置生效
5. 继续实现弹窗和交互

### Incremental Delivery

1. Foundational → Schema + types ready
2. US4 → 有测试数据可看 → 验证后端正常
3. US1 → 全局行高设置 → 验证设置面板功能
4. US2+3 → 弹出面板 + 点击 → 验证核心交互
5. Polish → 清理旧代码 + bug 修复 → 完整交付

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 用户特别要求修复相关 bug 以确保前端正常工作（T030, T031）
- 空文件夹自动删除（T028, T029）是跨 user story 的横切关注点
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
