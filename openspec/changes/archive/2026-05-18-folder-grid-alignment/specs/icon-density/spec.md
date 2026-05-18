## MODIFIED Requirements

### Requirement: Icon 大小根据密度自适应计算

系统 SHALL 根据当前 density 设置，在 Content 组件中自动计算并设置 CSS 变量 `--icon-size`、`--icon-gap`、`--row-height`、`--grid-margin` 以及 `--cell-width`、`--cell-gap-x`、`--cell-gap-y` 到 `.desktop-page` 元素上。其中 `--cell-width` 等网格布局变量通过 ResizeObserver 持续更新。

#### Scenario: 标准密度下的变量设置
- **WHEN** density 设置为 "standard"
- **THEN** `.desktop-page` 元素上设置 `--icon-size: 48px`、`--row-height: 80px`、`--grid-margin: 12px`
- **AND** `--cell-width`、`--cell-gap-x`、`--cell-gap-y` 根据容器宽度动态计算

#### Scenario: 窗口缩放后 cell-width 更新
- **WHEN** 用户缩放浏览器窗口导致容器宽度变化
- **THEN** `--cell-width` 在 `.desktop-page` 上更新为新的 cellWidth 值
- **AND** 依赖 `--cell-width` 的组件（文件夹等）自动重新计算尺寸
