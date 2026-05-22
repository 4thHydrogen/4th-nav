# Quick Start: 统一网格系统实现

**Date**: 2026-05-22
**Feature**: specs/002-unified-grid-system

## 实现顺序

按 Phase A → E 顺序实现，每个 Phase 完成后可独立验证。

## Phase A: 基础设施验证

### 后端修复验证
```bash
# 1. 确认 gridX/gridY 负值保留已合入（001 分支的修复）
# 2. 测试 MergeToFolderHandler 原子操作
curl -X POST /api/merge-to-folder -d '{"tool1Id": 1, "tool2Id": 2}'
# 预期：文件夹直接出现在两个条目位置，不跳转
```

### 布局算法验证
```bash
cd ui && npm run dev
# 1. 右键改组件大小 → 确认左上角锚定
# 2. 组件右侧有条目时 → 确认右侧条目被推移
# 3. 组件在面板最右列时 → 确认自身移到下一行
```

## Phase B: 统一组件验证

```bash
# 1. 主面板 1x1 条目 → 文件夹折叠态 1x1 条目 → 对比外观
# 2. 切换文件夹到 list 模式 → 确认折叠态全部显示不截断
# 3. 文件夹折叠态 list 模式 → 点击右下角交互区域 → 确认可以打开
```

## Phase C: 浮动窗口验证

```bash
# 1. 点击文件夹 → 浮动窗口出现在卡片附近
# 2. 文件夹靠近面板边缘 → 窗口自动靠拢
# 3. 浮动窗口打开时 → 主面板不可交互
# 4. 点击窗口外部 / 按 Esc → 窗口关闭
# 5. 窗口内条目外观与主面板一致
```

## Phase D: 全域拖拽验证

```bash
# 1. 浮动窗口内拖拽条目到窗口外松手 → 条目出现在主面板
# 2. 浮动窗口内拖拽重排 → 行为与主面板一致
# 3. Alt+拖拽窗口内两个条目 → 合并创建新文件夹放主面板
# 4. 折叠态拖拽可见条目到文件夹外 → 条目移至主面板
```

## Phase E: 边界条件验证

```bash
# 1. 浮动窗口内右键 → 菜单只有重命名和删除（无改大小）
# 2. 浮动窗口内删除最后条目 → 文件夹动画淡出并移除
# 3. 缩小浏览器窗口 → 浮动窗口自动关闭
# 4. 快速连续点击两个文件夹 → 前一个关闭后一个打开
# 5. 切换展示模式 → 折叠态和浮动窗口同时更新
```

## 关键文件变更参考

| Phase | 文件 | 变更类型 |
|-------|------|----------|
| A | `service/tools.go` | 修改 |
| A | `handler/handlers.go` | 修改 |
| A | `ui/src/components/WidgetGrid/useGridLayout.ts` | 修改 |
| B | `ui/src/components/WidgetTool/index.tsx` | 修改 |
| B | `ui/src/components/WidgetFolder/index.tsx` | 修改 |
| C | `ui/src/components/FolderFloatingWindow/index.tsx` | 新建 |
| C | `ui/src/components/WidgetGrid/index.tsx` | 修改 |
| D | `ui/src/components/WidgetGrid/useGridDrag.ts` | 修改 |
| E | `ui/src/components/ToolContextMenu/index.tsx` | 修改 |
