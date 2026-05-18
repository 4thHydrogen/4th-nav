## ADDED Requirements

### Requirement: 密度设置替代像素值设置

系统 SHALL 提供 density 设置（compact/standard/relaxed），替代原有的 iconSize 像素值设置。density 值存储在后端 nav_site_config 表中，类型为 TEXT，默认值 "standard"。

#### Scenario: 管理后台设置密度
- **WHEN** 管理员在网站配置中选择密度为 "紧凑"
- **THEN** 系统保存 density = "compact" 到数据库

#### Scenario: 未设置密度时使用默认值
- **WHEN** nav_site_config 表中 density 字段为空或不存在
- **THEN** 系统 SHALL 使用 "standard" 作为默认密度

### Requirement: Icon 大小根据密度自适应计算

系统 SHALL 根据当前 density 设置，在 Content 组件中自动计算并设置 CSS 变量 `--icon-size`、`--icon-gap`、`--row-height` 到 `.desktop-page` 元素上。

密度参数映射：

| 密度 | --row-height | --icon-size | --icon-gap |
|------|-------------|------------|------------|
| compact | 64px | 38px | 4px |
| standard | 80px | 48px | 6px |
| relaxed | 100px | 62px | 8px |

#### Scenario: 标准密度下的 icon 尺寸
- **WHEN** density 设置为 "standard"
- **THEN** `.desktop-page` 元素的 `--icon-size` 为 48px，`--icon-gap` 为 6px，`--row-height` 为 80px

#### Scenario: 紧凑密度下的 icon 尺寸
- **WHEN** density 设置为 "compact"
- **THEN** `.desktop-page` 元素的 `--icon-size` 为 38px，`--icon-gap` 为 4px，`--row-height` 为 64px

#### Scenario: 宽松密度下的 icon 尺寸
- **WHEN** density 设置为 "relaxed"
- **THEN** `.desktop-page` 元素的 `--icon-size` 为 62px，`--icon-gap` 为 8px，`--row-height` 为 100px

### Requirement: 通用 M×N 尺寸公式

所有使用网格尺寸的组件 SHALL 遵循统一的尺寸公式计算 icon 区域：

```
width  = M × var(--icon-size) + (M - 1) × var(--icon-gap)
height = N × var(--icon-size) + (N - 1) × var(--icon-gap)
```

每个组件通过 `--grid-w` 和 `--grid-h` CSS 自定义属性声明其网格尺寸。

#### Scenario: 1×1 icon 卡片
- **WHEN** 组件的 `--grid-w` 为 1，`--grid-h` 为 1
- **THEN** icon 区域宽度 = `--icon-size`，高度 = `--icon-size`

#### Scenario: 2×2 文件夹
- **WHEN** 组件的 `--grid-w` 为 2，`--grid-h` 为 2
- **THEN** icon 区域宽度 = `2 × --icon-size + --icon-gap`，高度 = `2 × --icon-size + --icon-gap`

#### Scenario: 3×1 组件
- **WHEN** 组件的 `--grid-w` 为 3，`--grid-h` 为 1
- **THEN** icon 区域宽度 = `3 × --icon-size + 2 × --icon-gap`，高度 = `--icon-size`

### Requirement: 文件夹背景紧贴子 icon

文件夹组件的背景区域 SHALL 与其包含的子 icon 网格齐平，不使用 `--cell-width` 或 `--row-height` 混搭计算。文件夹文字标签 SHALL 放置在 icon 区域下方。

#### Scenario: 2×2 文件夹背景尺寸
- **WHEN** 一个 2×2 文件夹，密度为 standard（--icon-size=48px, --icon-gap=6px）
- **THEN** 文件夹背景宽度 = 2 × 48 + 6 = 102px，高度 = 2 × 48 + 6 = 102px（不含 padding）

#### Scenario: 文件夹文字标签位置
- **WHEN** 任意尺寸的文件夹渲染完成
- **THEN** 文件夹名称显示在 icon 区域正下方，文字 max-width 不超过 icon 区域宽度

### Requirement: 所有组件 fallback 值统一

所有使用 `var(--icon-size)` 的组件 SHALL 使用相同的 fallback 值 48px（标准密度下的值）。

#### Scenario: CSS 变量未设置时的 fallback
- **WHEN** `--icon-size` CSS 变量未被设置（如组件在 `.desktop-page` 外使用）
- **THEN** 所有组件的 icon 尺寸 fallback 为 48px

### Requirement: 网格行高和间距跟随密度

`useGridLayout` 中的 ROW_HEIGHT 和 MARGIN SHALL 从 CSS 变量 `--row-height` 和组件 padding 动态读取，而非硬编码为 JS 常量。

#### Scenario: 切换密度后网格间距变化
- **WHEN** 用户将密度从 "standard" 切换为 "compact"
- **THEN** 网格行高从 80px 变为 64px，组件间距从 12px 变为 8px

#### Scenario: 密度切换后布局重排
- **WHEN** 密度设置变更导致 --row-height 变化
- **THEN** 所有网格项 SHALL 自动重排以适应新的行高和间距
