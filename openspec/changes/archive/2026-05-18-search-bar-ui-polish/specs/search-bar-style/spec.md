## ADDED Requirements

### Requirement: Search icon inside the input bar
搜索图标 SHALL 位于搜索栏容器内部左侧，与输入文本视觉上属于同一个视觉单元。图标与输入文本之间有适当间距。

#### Scenario: Search icon position
- **WHEN** 搜索栏渲染完成
- **THEN** 搜索图标显示在搜索条内部左侧，不是独立的悬浮元素

### Requirement: Engine selector button inside the input bar
引擎选择按钮 SHALL 位于搜索栏容器内部右侧，与输入文本视觉上属于同一个视觉单元。

#### Scenario: Engine button position
- **WHEN** 搜索栏渲染完成
- **THEN** 引擎选择按钮显示在搜索条内部最右侧

### Requirement: Pill-shaped search bar
搜索栏外形 SHALL 为胶囊形，两端为半圆（`border-radius` 足够大以形成半圆）。

#### Scenario: Pill shape rendering
- **WHEN** 搜索栏渲染完成
- **THEN** 搜索栏两侧呈半圆形，整体为胶囊造型

### Requirement: Glassmorphism background
搜索栏背景 SHALL 使用毛玻璃效果（`backdrop-filter: blur` + 半透明背景色），而非纯半透明。

#### Scenario: Frosted glass effect
- **WHEN** 页面有背景图或非纯色背景
- **THEN** 搜索栏背景呈现磨砂玻璃效果，能模糊看到下方背景

#### Scenario: Plain background fallback
- **WHEN** 页面为纯色背景（无背景图）
- **THEN** 搜索栏使用半透明背景色，毛玻璃效果不明显但视觉仍然可接受

### Requirement: Remove slash keyboard hint
搜索栏中 SHALL 不再显示 `/` 快捷键提示元素。

#### Scenario: No slash hint displayed
- **WHEN** 搜索栏渲染完成
- **THEN** 搜索栏内不显示 `/` 字符或相关的快捷键提示 UI
