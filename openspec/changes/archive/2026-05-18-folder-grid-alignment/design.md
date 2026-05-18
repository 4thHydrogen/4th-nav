## Context

当前 `--icon-gap` 是密度映射表中的静态值（compact=4, standard=6, relaxed=8）。但网格中两个相邻 icon 图片之间的实际视觉间距由以下因素决定：

```
实际水平间距 = cellWidth - iconSize + MARGIN[0]
实际垂直间距 = ROW_HEIGHT - iconSize + MARGIN[1]
```

例如 standard 密度下：cellWidth≈72, iconSize=48, MARGIN=12
→ 水平间距 = 72 - 48 + 12 = 36px（而非 6px）
→ 垂直间距 = 80 - 48 + 12 = 44px（而非 6px）

## Goals / Non-Goals

**Goals:**
- 文件夹的四条边与网格中对应位置的 icon 边缘精确对齐
- `--icon-gap` 从网格布局参数动态计算，不再使用静态映射值
- 文件夹内子 icon 仍使用 `--icon-size`

**Non-Goals:**
- 不改变密度系统或 `--icon-size` 的映射
- 不改变网格列数/断点体系
- 不处理 icon 在单元格内的垂直居中偏移（本次假设 icon 贴顶排列或居中不影响水平对齐）

## Decisions

### Decision 1: --icon-gap 由 JS 在设置密度时同步计算

**选择**: 在 Content/index.tsx 的 density useEffect 中，除了设置 `--icon-size`、`--row-height`、`--grid-margin` 外，额外计算并设置 `--icon-gap-h` 和 `--icon-gap-v`（水平/垂直分开）。

**理由**: 文件夹公式需要知道 icon 之间的真实间距，这个间距取决于 cellWidth（响应式，随窗口变化）和 ROW_HEIGHT/MARGIN。只有 JS 能拿到这些运行时值。

**备选方案**:
- A) 纯 CSS calc：`--icon-gap: calc(var(--cell-width) - var(--icon-size) + var(--grid-margin))` — 需要在 `.desktop-page` 上也能读到 `--cell-width`，但 `--cell-width` 是 WidgetGrid 在内部容器上设置的，不在 `.desktop-page` 上。需要提升变量位置。
- B) 在 WidgetGrid 中计算并设置 — 但文件夹和 WidgetGrid 是兄弟关系，CSS 变量继承不便。

选择方案 A（纯 CSS calc），因为更简洁。只需将 `--cell-width` 从 WidgetGrid 内部容器提升到 `.desktop-page` 或在 `.desktop-page` 上设置即可。

### Decision 2: 统一为一个 --icon-gap（不分水平/垂直）

**选择**: 假设 cellWidth ≈ ROW_HEIGHT（基本正方形网格），使用单一 `--icon-gap`。

**理由**: 用户期望 icon 间距在上下左右一致。如果 cellWidth 和 ROW_HEIGHT 差距大，应对齐网格使其更接近正方形。单一变量简化公式。

实际计算取两者中较小的值，或取平均值。最简单的做法：`--icon-gap = ROW_HEIGHT - iconSize`（垂直间距），因为 ROW_HEIGHT 是固定的，而 cellWidth 是响应式的。

但更准确的做法是让 `--icon-gap` = `cellWidth - iconSize + MARGIN`（水平间距），因为文件夹的水平对齐更明显。

最终选择：使用 CSS calc 在 `.widget-folder` 上直接计算，不依赖全局 `--icon-gap`：
```css
width: calc(
  var(--grid-w, 1) * var(--icon-size, 48px)
  + (var(--grid-w, 1) - 1) * (var(--cell-width, 72px) - var(--icon-size, 48px) + var(--cell-gap-x, 12px))
);
```

但这要求 `.desktop-page` 上有 `--cell-width` 和 `--cell-gap-x`。

### Decision 3: 将网格布局变量提升到 .desktop-page

**选择**: 在 `Content/index.tsx` 的 useEffect 中，除了设置密度变量，还监听容器宽度变化并设置 `--cell-width`、`--cell-gap-x`、`--cell-gap-y` 到 `.desktop-page`。

**理由**: 这些值目前只在 WidgetGrid 内部容器的 inline style 上设置，文件夹等组件无法继承。提升到 `.desktop-page` 后，所有组件都能通过 CSS 变量获取网格参数。

## Risks / Trade-offs

- **[cellWidth 响应式]** cellWidth 随窗口变化，需要 ResizeObserver 持续更新 `--cell-width` → 在 Content 中添加 observer，复杂度增加
- **[垂直间距不对称]** ROW_HEIGHT(80) ≠ cellWidth(~72)，垂直间距比水平间距大 → 文件夹可能不是完美正方形，但比当前好很多
- **[文件夹子 icon 间距]** 文件夹内部子 icon 的间距用 `--icon-gap`，但这个值现在是网格间距（36px+），子 icon 之间会很稀疏 → 需要区分"文件夹内间距"和"网格间距"
