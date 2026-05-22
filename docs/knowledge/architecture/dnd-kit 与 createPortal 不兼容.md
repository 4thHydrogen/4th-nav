---
title: dnd-kit 与 createPortal 不兼容
type: reference
permalink: 4th-nav/architecture/dnd-kit-与-create-portal-不兼容
---

# dnd-kit 与 createPortal 不兼容

**约束**: `@dnd-kit/core` 的 `useDraggable` 和 `useDroppable` hooks 在 DOM 节点通过 `createPortal` 渲染到 `document.body` 时无法正常工作。portal 将 DOM 移到 DndContext DOM 树之外，dnd-kit 的传感器无法追踪这些节点。

**影响范围**: `FolderPopupPanel` 使用 `createPortal(..., document.body)` 渲染，弹窗内的条目不能使用 dnd-kit 拖拽。

**替代方案**: 使用原生 Pointer Events：
- `pointerdown` 记录起始位置和 tool ID
- document 级别 `pointermove` / `pointerup` 监听
- 5px 距离阈值区分点击和拖拽
- `pointerup` 时检测指针是否在目标区域外

**相关文件**: `ui/src/components/FolderPopupPanel/index.tsx`

- relation: [[folder-api-conventions]]
- relation: [[go-sql-param-count]]