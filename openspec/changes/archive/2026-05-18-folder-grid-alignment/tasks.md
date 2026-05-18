## 1. 提升网格变量到 .desktop-page

- [x] 1.1 `ui/src/components/Content/index.tsx`: 新增 ResizeObserver 监听 `.desktop-workspace` 宽度，计算 `--cell-width`、`--cell-gap-x`、`--cell-gap-y` 并设置到 `.desktop-page`
- [x] 1.2 确认 `WidgetGrid` 内设置的 `--cell-width` 等变量与 `.desktop-page` 上的值保持一致（可移除重复设置）

## 2. 文件夹尺寸公式修正

- [x] 2.1 `ui/src/components/WidgetFolder/index.css`: 背景尺寸公式改为使用 `--cell-width`、`--row-height`、`--cell-gap-x`、`--cell-gap-y` 动态计算间距（通过 CSS calc 内联计算 `--folder-gap-x`/`--folder-gap-y`）
- [x] 2.2 `ui/src/components/WidgetFolder/index.css`: 新增 `--folder-inner-gap` 变量（默认 6px），用于文件夹内部子 icon 网格的 gap

## 3. 验证

- [x] 3.1 标准/紧凑/宽松密度下，2×2 文件夹四边与网格 icon 边缘对齐
- [x] 3.2 缩放浏览器窗口后文件夹尺寸跟随更新
- [x] 3.3 文件夹内子 icon 间距保持紧凑（~6px），不随网格间距变大
- [x] 3.4 运行 `cd ui && pnpm test` 确认无回归
