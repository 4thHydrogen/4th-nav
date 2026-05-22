# Research: 统一网格系统

**Date**: 2026-05-22
**Feature**: specs/002-unified-grid-system

## Decision 1: 浮动窗口 DOM 策略

**Decision**: 浮动窗口使用 CSS `position: absolute` 保持在 DndContext DOM 树内，不使用 createPortal。

**Rationale**: dnd-kit 的 `useDraggable`/`useDroppable` hooks 依赖 `data-*` 属性和 DOM 查询，这些在 portal 跨 DOM 树时失效。保持浮动窗口在 DndContext 的 DOM 子树内（使用 absolute 定位 + z-index 覆盖）是最小侵入的解决方案。

**Alternatives considered**:
- createPortal 到 document.body（当前方案）→ 导致 dnd-kit 失效，已排除
- 将 DndContext 提升到 document.body 层级 → 需要大幅重构，风险高
- 使用 Pointer Events 自定义拖拽 → 已在 FolderPopupPanel 中使用，行为不一致，排除

## Decision 2: 浮动窗口位置计算

**Decision**: 基于文件夹卡片的 `getBoundingClientRect()` 计算浮动窗口位置，卡片右侧优先，空间不足时左侧或下方，始终在视口边界内。

**Rationale**: 用户明确要求"文件夹卡片附近，遇到面板边界时靠拢"。使用 `getBoundingClientRect` 可以精确获取卡片位置，结合浮动窗口尺寸计算最优位置。

**Alternatives considered**:
- 视口中心固定位置 → 用户选择卡片附近
- 文件夹卡片内部展开 → 用户明确拒绝原地展开

## Decision 3: 主面板阻塞实现

**Decision**: 使用全屏半透明遮罩层（overlay），z-index 低于浮动窗口但高于主面板。遮罩层捕获所有 pointer events，浮动窗口正常交互。

**Rationale**: 用户要求完全阻塞主面板。遮罩层是最简单直接的实现方式，同时提供点击外部关闭的功能。

**Alternatives considered**:
- 主面板 `pointer-events: none` → 简单但无法区分点击和拖拽
- Modal 式锁定 → 过于复杂

## Decision 4: 拖出浮动窗口检测

**Decision**: 在浮动窗口内拖拽时，通过 `pointermove` 事件实时检测指针是否超出浮动窗口的 `getBoundingClientRect()` 边界。超出边界时显示放置提示，松手时触发移至主面板操作。

**Rationale**: 需要在 dnd-kit 的拖拽过程中判断是否在窗口外。dnd-kit 不直接提供"拖出某个区域"的事件，需要结合 Pointer Events 或 `DragMoveEvent` 处理。

**Alternatives considered**:
- 纯 dnd-kit onDragEnd 检测最终位置 → 无法提供拖出过程中的视觉反馈
- 使用 dnd-kit 的 `DragOverlay` + 自定义 drop target → 更复杂但更一致

## Decision 5: 碰撞右推布局策略

**Decision**: 改造 `buildLayout` 和 `moveItem` 函数，碰撞策略从"仅下移"改为"先右推，右推到边界再下移"。锚点始终为左上角。

**Rationale**: 用户要求组件改变大小时左上角锚定，右侧有物体则推移，到边界则下移。这与当前 `buildLayout` 的碰撞检测逻辑需要重构。

**Alternatives considered**:
- 使用第三方网格布局库（react-grid-layout）→ 引入大量依赖，与现有 dnd-kit 集成复杂
- 保持当前碰撞下移 + 手动调整 → 已被用户否决

## Decision 6: 统一 WidgetTool 组件策略

**Decision**: 扩展 `WidgetTool` 组件，添加 `viewMode` prop（"grid" | "list"），根据模式切换渲染。在所有位置（主面板、文件夹折叠态、浮动窗口）使用 `WidgetTool`。逐步淘汰 `ToolItem`。

**Rationale**: 用户要求条目在任何位置外观一致。`WidgetTool` 已经是主面板的标准组件，扩展它比创建新组件更合理。

**Alternatives considered**:
- 创建新的 UnifiedTool 组件 → 重复工作，增加维护成本
- 直接使用 ToolItem 替代 WidgetTool → ToolItem 功能较少，反向迁移更困难

## Decision 7: 合并创建文件夹原子操作

**Decision**: 后端 `MergeToFolderHandler` 改造为：接收两个 toolId 和目标位置 → 事务内创建文件夹（设置 gridX/gridY）→ 移入两个条目 → 返回结果。避免"先创建再移动"的两步操作。

**Rationale**: 当前两步操作导致用户看到文件夹先出现在第一行再跳转。原子操作消除了这个视觉问题。

**Alternatives considered**:
- 前端计算位置后传给后端 → 仍然有两次请求，存在竞态条件
- 保持两步但加快动画 → 未根本解决问题
