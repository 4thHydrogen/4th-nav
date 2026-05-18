## ADDED Requirements

### Requirement: Dock 栏毛玻璃容器
Dock 栏 SHALL 显示毛玻璃效果的背景容器，包含半透明底色、`backdrop-filter: blur` 模糊、微弱边框和圆角。

#### Scenario: 空态也有容器
- **WHEN** Dock 栏没有图标（空态）
- **THEN** Dock 仍显示毛玻璃容器，内含引导文字和装饰图标

#### Scenario: 亮色模式下的默认样式
- **WHEN** 页面处于亮色模式且无背景图
- **THEN** Dock 容器背景为 `rgba(255, 255, 255, 0.72)` + `backdrop-filter: blur(18px)` + `border: 1px solid rgba(15, 23, 42, 0.08)` + `border-radius: 18px`

#### Scenario: 暗色模式下
- **WHEN** 页面处于 `body.dark-mode`
- **THEN** Dock 容器背景色、边框色自动切换为暗色变体，与 `--widget-bg`/`--widget-border` 变量一致

#### Scenario: 背景图/毛玻璃模式下
- **WHEN** 页面启用了背景图（`body.has-background`）或毛玻璃效果（`body.glassmorphism`）
- **THEN** Dock 容器使用与暗色模式一致的深色半透明背景

### Requirement: 悬浮鱼眼放大效果
当鼠标悬浮在某个 Dock 图标上时，该图标 SHALL 放大，相邻的左右各一个图标 SHALL 缩小，形成鱼眼视觉效果。

#### Scenario: 悬浮中间图标
- **WHEN** 鼠标悬浮在第 N 个图标上（N > 1 且 N < 总数）
- **THEN** 第 N 个图标 scale 为 1.3，第 N-1 和 N+1 个图标 scale 为 0.88

#### Scenario: 悬浮第一个图标
- **WHEN** 鼠标悬浮在第 1 个图标上
- **THEN** 第 1 个图标 scale 为 1.3，第 2 个图标 scale 为 0.88

#### Scenario: 悬浮最后一个图标
- **WHEN** 鼠标悬浮在最后一个图标上
- **THEN** 最后一个图标 scale 为 1.3，倒数第二个图标 scale 为 0.88

#### Scenario: 仅有一个图标
- **WHEN** Dock 栏只有一个图标且鼠标悬浮
- **THEN** 该图标 scale 为 1.3，无邻居缩小

#### Scenario: 拖拽中禁用鱼眼
- **WHEN** 用户正在拖拽某个图标
- **THEN** 鱼眼效果不触发，仅显示拖拽占位指示

### Requirement: 拖拽视觉反馈
拖拽排序时 SHALL 显示占位指示，明确表达放置目标位置。

#### Scenario: 拖拽到目标左侧
- **WHEN** 拖拽的图标经过另一个图标的左侧
- **THEN** 该图标左侧显示一条竖线或间距增大作为放置指示

#### Scenario: 拖拽到目标右侧
- **WHEN** 拖拽的图标经过另一个图标的右侧
- **THEN** 该图标右侧显示一条竖线或间距增大作为放置指示

### Requirement: Dock 内部元素排布
Dock 栏内的图标 SHALL 垂直居中对齐，间距适中，图标尺寸适配容器比例。

#### Scenario: 图标居中对齐
- **WHEN** Dock 栏有多个图标
- **THEN** 图标在容器内垂直居中（`align-items: center`），不使用 `flex-end`

#### Scenario: 图标尺寸
- **WHEN** Dock 栏渲染图标
- **THEN** 图标尺寸为 40px（通过 `--dock-icon-size` 局部变量），不跟随全局 `--icon-size`

#### Scenario: 图标间距
- **WHEN** Dock 栏有多个图标
- **THEN** 图标之间的间距为 6px，在鱼眼放大效果下视觉协调

### Requirement: Tooltip 样式优化
Dock 图标的 tooltip SHALL 在悬浮时显示，保持现有的文字和定位行为，视觉样式与毛玻璃容器风格协调。

#### Scenario: 悬浮显示 tooltip
- **WHEN** 鼠标悬浮在 Dock 图标上
- **THEN** tooltip 在图标上方显示，带有 0.15s 的淡入动画
