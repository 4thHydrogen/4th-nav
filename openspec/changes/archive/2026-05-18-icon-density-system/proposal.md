## Why

当前 icon 大小设置（像素值下拉框 32/40/44/52/60px）在前端未正确生效，且设计不合理——用户不应手动选择像素值。Icon 大小应由系统根据网格密度和容器宽度自适应计算。同时，各组件（WidgetTool、WidgetFolder、DockBar、ToolItem）的 icon 尺寸 fallback 值不统一（44px/48px/56px），缺乏统一的尺寸体系，导致未来新增组件时没有可遵循的规范。

## What Changes

- **BREAKING**: 移除 `iconSize` 像素值设置，替换为 `density` 密度设置（compact/standard/relaxed）
- 新增自适应 icon 尺寸计算系统：`--icon-size` 由 density + 容器宽度自动推导
- 统一所有组件的尺寸公式：任何 M×N 组件的 icon 区域 = `M × --icon-size + (M-1) × --icon-gap`
- 修正 WidgetTool large 模式硬编码 48px → 使用 `var(--icon-size)`
- 修正 WidgetFolder 尺寸公式，使用 `--icon-size` 替代 `--cell-width`/`--row-height` 混搭
- 统一 DockBar、ToolItem 的 fallback 值
- ROW_HEIGHT 和 MARGIN 根据密度自适应调整

## Capabilities

### New Capabilities
- `icon-density`: 自适应 icon 密度系统 — 根据 density 设置和容器宽度自动计算 --icon-size、--icon-gap、--row-height，为所有组件提供统一的尺寸基准

### Modified Capabilities
- `grid-snap-logic`: 拖拽判定逻辑中的 ROW_HEIGHT 和 MARGIN 将从常量改为 CSS 变量，影响 gridToPixels/pixelsToGrid 的计算

## Impact

- **后端**: `database/init.db.go`（迁移 iconSize → density）、`service/site_config.go`、`types/types.go`
- **前端类型**: `ui/src/types/index.ts`（iconSize → density）
- **前端核心**: `ui/src/components/Content/index.tsx`（自适应计算逻辑）
- **前端组件**: WidgetTool/index.css、WidgetFolder/index.css、DockBar/index.css、ToolItem/index.css
- **前端管理**: `ui/src/pages/admin/tabs/Setting.tsx`（设置表单）
- **前端网格**: `ui/src/components/WidgetGrid/useGridLayout.ts`（ROW_HEIGHT 动态化）
- **无外部依赖变更**
