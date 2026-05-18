## Why

icon-density-system 引入了 `--icon-size` / `--icon-gap` 密度系统，文件夹公式改为 `W × --icon-size + (W-1) × --icon-gap`。但 `--icon-gap` 是静态值（6px），与网格中 icon 图片之间的实际视觉间距（36-44px）严重不符，导致文件夹四边无法与对应位置的 icon 对齐。

## What Changes

- 文件夹尺寸公式中的 `--icon-gap` 改为动态值，从网格布局的实际间距计算得出
- `--icon-gap` 在运行时由 `cellWidth - iconSize + MARGIN` 计算（水平方向），垂直方向同理
- 文件夹内的子 icon 保持 `--icon-size` 大小不变
- 不改变密度系统（density）和 `--icon-size` 的计算逻辑

## Capabilities

### New Capabilities

- `dynamic-icon-gap`: 动态计算 --icon-gap 使文件夹与网格 icon 对齐

### Modified Capabilities

- `icon-density`: --icon-gap 从静态值改为动态计算值，影响文件夹和未来组件的尺寸公式

## Impact

- **前端核心**: `ui/src/components/Content/index.tsx`（--icon-gap 计算逻辑）
- **前端组件**: `ui/src/components/WidgetFolder/index.css`（公式消费者）
- **前端网格**: `ui/src/components/WidgetGrid/useGridLayout.ts`（提供 cellWidth/MARGIN 供计算）
- 无后端变更
