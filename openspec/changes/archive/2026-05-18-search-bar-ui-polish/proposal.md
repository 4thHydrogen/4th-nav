## Why

搜索栏当前的布局元素（搜索图标、引擎按钮、快捷键提示）排列在输入框外部，视觉上松散。背景使用半透明而非毛玻璃，圆角为标准 8px 矩形而非胶囊形。需要将这些元素收拢到搜索栏内部，统一为一个紧凑的胶囊形毛玻璃搜索条。

## What Changes

- 搜索图标移入输入栏内部左侧
- 引擎选择按钮移入输入栏内部右侧
- 移除 `/` 快捷键提示（当前行为是任意键聚焦，`/` 提示不准确）
- 搜索栏外形改为胶囊形（两侧半圆，`border-radius: 9999px`）
- 搜索栏背景从半透明改为毛玻璃效果（`backdrop-filter: blur` + `background: rgba(..., 0.x)`）

## Capabilities

### New Capabilities
- `search-bar-style`: 搜索栏视觉样式优化 — 胶囊外形、毛玻璃背景、图标/按钮内嵌布局

### Modified Capabilities
<!-- 无 -->

## Impact

- **前端 CSS**：`SearchBar/index.css` 和 `Content/index.css` 中的搜索栏相关样式
- **前端 JSX**：`SearchBar/index.tsx` 移除 `/` 提示元素，调整 DOM 结构以支持内嵌布局
- **无后端变更**，无逻辑变更，纯视觉优化
