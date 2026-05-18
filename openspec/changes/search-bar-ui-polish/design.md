## Context

当前搜索栏结构是 `.desktop-search-shell > .search > .search-wraper`，内部元素（搜索图标、input、引擎按钮、`/` 提示）以 flex 水平排列。每个元素独立渲染，input 有自己的背景和圆角。外壳 `.desktop-search-shell` 背景透明，不参与视觉表现。

搜索栏在不同主题下有不同背景色：
- 默认：`var(--widget-bg)` 或系统默认
- 深色模式：`rgba(255, 255, 255, 0.08)`
- 有背景图/glassmorphism：`rgba(255, 255, 255, 0.20)`

## Goals / Non-Goals

**Goals:**
- 搜索图标和引擎按钮视觉上位于输入栏内部
- 胶囊外形（两侧半圆）
- 毛玻璃背景效果
- 移除不准确的 `/` 快捷键提示

**Non-Goals:**
- 搜索功能逻辑变更
- 搜索栏尺寸/宽度调整
- 下拉菜单样式变更

## Decisions

### 1. 布局方案：.search-wraper 作为视觉容器

**选择**：让 `.search-wraper` 成为带背景、圆角、内边距的视觉容器。input 去掉独立背景/边框，仅作为透明的文本输入区域。

**理由**：将 flex 容器作为"搜索条"视觉单元是最自然的做法。图标和按钮作为 flex 子项自然排列在 input 两侧，无需 absolute 定位。

```
之前:  [🔍] [  input (独立背景)  ] [B] [/]
之后:  ╭──────────────────────────────────╮
       │ 🔍  input (透明)...           [B] │
       ╰──────────────────────────────────╯
       ↑ search-wraper 拥有背景、圆角、padding
```

### 2. 毛玻璃实现：backdrop-filter + rgba 背景

**选择**：在 `.search-wraper` 上使用 `backdrop-filter: blur(12px)` + `background: rgba(255, 255, 255, 0.12)`。

**理由**：项目已有 glassmorphism CSS class（在 `body` 上切换），但搜索栏需要独立控制。使用 `backdrop-filter` 直接在搜索条上实现毛玻璃，不依赖全局 class。深色/浅色模式通过 CSS 变量或 media query 区分 rgba 透明度。

### 3. 移除 `/` 提示

**选择**：从 JSX 中移除 `<span className="search-hint">/</span>` 及对应 CSS。

**理由**：实际行为是任意键聚焦，`/` 提示不准确。移除后搜索栏更简洁。

## Risks / Trade-offs

**[兼容性] backdrop-filter 在旧浏览器不支持** → 缓解：Safari、Chrome、Edge 全部支持。Firefox 103+ 支持。降级后显示为普通半透明背景，不影响功能。

**[视觉] 毛玻璃效果在有背景图时效果最佳，纯色背景时效果不明显** → 接受：这是毛玻璃的固有特性，纯色背景下表现仍可接受。
