## ADDED Requirements

### Requirement: 文件夹尺寸基于网格实际间距动态计算

文件夹的背景尺寸 SHALL 使用网格布局的实际间距（cellWidth - iconSize + gap）计算，而非静态的 `--icon-gap` 值。公式为：

```
width  = gridW × iconSize + (gridW - 1) × (cellWidth - iconSize + cellGapX)
height = gridH × iconSize + (gridH - 1) × (rowHeight - iconSize + cellGapY)
```

#### Scenario: 2×2 文件夹在标准密度下对齐
- **WHEN** density = "standard"（iconSize=48, rowHeight=80, margin=12, cellWidth≈72）
- **AND** 一个 2×2 文件夹
- **THEN** 文件夹宽度 ≈ 2×48 + (72-48+12) = 96 + 36 = 132px
- **AND** 文件夹高度 ≈ 2×48 + (80-48+12) = 96 + 44 = 140px
- **AND** 文件夹四条边与对应位置的 icon 边缘视觉对齐

#### Scenario: 不同密度切换后对齐保持
- **WHEN** 用户从 "standard" 切换为 "compact"
- **THEN** 文件夹尺寸随 iconSize 和 rowHeight 变化自动调整，保持与 icon 对齐

### Requirement: 网格布局变量提升到 .desktop-page

`--cell-width`、`--cell-gap-x`、`--cell-gap-y` SHALL 设置在 `.desktop-page` 元素上，使所有子组件（包括文件夹、DockBar 等）都能通过 CSS 变量继承获取网格参数。

#### Scenario: 文件夹组件通过 CSS 变量读取 cellWidth
- **WHEN** 文件夹 CSS 中使用 `var(--cell-width)`
- **THEN** 获取到与 WidgetGrid 相同的 cellWidth 值

### Requirement: 文件夹内子 icon 间距独立于网格间距

文件夹内部子 icon 之间的间距 SHALL 使用较小的固定值（如 6px），而非网格间距（36px+）。这通过单独的 `--folder-inner-gap` CSS 变量控制。

#### Scenario: 文件夹内 4 个子 icon 间距紧凑
- **WHEN** 一个 2×2 文件夹包含 4 个子 icon
- **THEN** 子 icon 之间间距为 `--folder-inner-gap`（约 6px），不是网格间距
