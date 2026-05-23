# 4th-nav Constitution

## Core Principles

### I. 基础设施必须被实际接入

创建新的 hook、组件、工具函数时，必须在同一个 PR/任务中将其接入实际调用点。未被使用的抽象等同于技术债务。

**Why**: 曾创建 `useFloatingPanel` 状态机 hook 但未接入 WidgetGrid，导致文件夹浮窗仍用旧的 zustand popupPanel + useState 模式，浮层系统的基础设施写了等于白写。

**How to apply**: 每个新基础设施文件的创建，必须伴随至少一个消费者的迁移。代码审查时检查新文件是否有 import/use。

### II. 迁移必须彻底，不留双轨

当决定从方案 A 迁移到方案 B 时，必须在同一任务中完成：删除旧代码、清理旧状态、清理旧文件。不要保留"标记 deprecated"的中间态。

**Why**: 曾将 FolderPopupPanel 迁移到 FolderFloatingWindow + FloatingPortal，但保留 FolderPopupPanel 目录、保留 ui.ts 中的 popupPanel/openPopupPanel/closePopupPanel 状态、保留 WidgetGrid 中的 folderCardRect useState。导致状态分散在 3 处（zustand popupPanel + useState expandedFolderId + useState folderCardRect），快速点击时产生竞态。

**How to apply**: 迁移清单必须包含：(1) 新实现接入 (2) 旧代码删除 (3) 旧 state 清理 (4) 旧文件删除。全部完成才算迁移完成。

### III. 状态单一来源

同一个 UI 状态（如"当前打开的文件夹"）只能有一个权威来源。派生状态从权威来源计算，不要独立维护。

**Why**: 文件夹浮窗的"打开状态"被拆在 `popupPanel.visible`、`expandedFolderId`、`folderCardRect` 三处，导致快速点击时三者不同步，出现幽灵 hover 和无法关闭的 bug。

**How to apply**: 设计状态时先问"谁是权威来源？"。如果发现同一概念在多处维护，立即合并。派生值用 useMemo/selector 计算，不用独立 state。

### IV. 不要忽略文档中的明确参数

当 spec/文档明确指定了数值、方向、placement 等参数时，必须严格遵循，不要自作主张替换。

**Why**: 文档明确要求搜索引擎菜单 placement 为 `right-start`（从按钮右侧展开），实现时用了 `bottom-end`（从按钮下方展开），导致菜单位置和动画方向不符合设计预期。

**How to apply**: 实现前对照文档逐项检查参数。如果文档参数不合理，先与用户讨论确认后再修改文档，不要悄悄替换。

### V. 浮层统一管理

所有浮动 UI（文件夹浮窗、下拉菜单、右键菜单、tooltip）必须通过统一的浮层系统管理：
- 渲染位置：`FloatingPortal` → `#app-overlay-root`
- 定位：`placement.ts` viewport 约束计算
- 外部点击：`useOutsidePointerDown` pointerdown capture
- 状态：`useFloatingPanel` 状态机
- 层级：CSS z-index token（不用局部 z-index 数值）

**Why**: 分散管理的浮层会因 stacking context、overflow、z-index 竞争导致各种交互 bug。

**How to apply**: 新增任何浮动 UI 前，先检查 OverlayLayer/ 是否已有适用的基础设施。如果没有，先扩展基础设施再实现功能。

## Development Constraints

- z-index 必须使用 CSS token（`--z-*`），不写局部数值
- 浮层定位只依赖 viewport 坐标（`DOMRect` + `window.innerWidth/Height`），不依赖父容器尺寸
- `pointer-events: none` 只在 `body.overlay-open` 时应用到主内容区，不应用到浮层本身
- 快速点击竞态用 `instanceId` 防护，不用 `setTimeout` 延迟

## Governance

- 违反以上原则的代码不应被合并
- 迁移任务必须包含清理步骤，不允许保留双轨
- 新基础设施必须伴随消费者接入

**Version**: 1.0.0 | **Ratified**: 2026-05-23 | **Last Amended**: 2026-05-23
