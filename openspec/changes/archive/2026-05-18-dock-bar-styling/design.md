## Context

当前 DockBar 组件（`ui/src/components/DockBar/`）具备完整的拖拽排序和右键移除功能，但存在以下问题：
- 视觉样式缺失——`.dock-bar` 背景为 `transparent`，没有容器感
- 内部排布不够精致——`align-items: flex-end` 导致图标底部对齐，放大时向上溢出且底部不齐；`gap: 10px` 固定间距在鱼眼放大时不够协调
- 图标尺寸（48px）与毛玻璃容器的比例偏大，macOS Dock 的图标通常比容器内边距小
- 空态提示只是裸文字，没有容器包裹

项目已建立 `--widget-*` CSS 变量体系（定义在 `Content/index.css` 的 `.desktop-page`），支持亮色/暗色/背景图三种模式的自动切换。

## Goals / Non-Goals

**Goals:**
- 为 Dock 栏添加 macOS 风格的毛玻璃容器背景
- 优化内部排布：图标垂直居中、间距自适应、图标尺寸缩小为 40px 以适配容器比例
- 空态提示增加容器和装饰图标，提升引导感
- 实现悬浮时的鱼眼放大效果（当前图标放大 + 邻居图标连带缩小）
- 在 dark-mode 和 has-background/glassmorphism 模式下自动适配颜色
- 拖拽时提供占位指示

**Non-Goals:**
- 不改动拖拽排序逻辑和 API 调用
- 不添加 Dock 栏的显示/隐藏动画或自动隐藏功能
- 不新增 Dock 相关的后端接口
- 不引入新的 npm 依赖

## Decisions

### 1. 纯 CSS 实现鱼眼效果

使用 CSS `:has()` 选择器 + 相邻兄弟选择器实现邻居缩小，不需要额外的 React ref 或 JavaScript 计算。

**理由：** 项目不兼容 IE，现代浏览器均支持 `:has()`。纯 CSS 方案零 JS 开销，且与现有的 `transform: scale(1.3)` 悬浮动效自然结合。

**替代方案：** React state + inline style 动态计算每个图标的 scale——复杂度高，且 drag-and-drop 已使用 state，会增加重渲染。

### 2. 复用 --widget-* CSS 变量

Dock 栏容器背景、边框、阴影直接复用 `.desktop-page` 上已定义的 `--widget-bg`、`--widget-border`、`--widget-overlay-shadow`。

**理由：** 项目已有三套模式的变量覆盖（亮色默认、`body.dark-mode`、`body.has-background`），复用可保证视觉一致性且无需额外维护。

### 3. 毛玻璃容器样式

Dock 容器使用 `backdrop-filter: blur(18px)` + 半透明背景 + 微弱 border + 圆角。

**理由：** 与项目现有的 WidgetFolder、SearchBar 等组件的毛玻璃风格一致。

### 4. 图标尺寸与内部排布

Dock 图标从 48px 缩小为 40px（通过 `--dock-icon-size: 40px` 局部变量控制），`align-items` 从 `flex-end` 改为 `center`，`gap` 调整为 `6px`。

**理由：** 48px 图标在毛玻璃容器中占比过大，缩小后留出更多内边距，视觉更精致。居中对齐使鱼眼放大时上下对称，不会出现底部不齐或向上溢出的问题。

### 5. 空态 Dock 优化

空态 Dock 也显示毛玻璃容器（与有图标时一致），内部显示一个 Dock 图标（加号/引导图标）+ 提示文字。

**理由：** 统一视觉语言，空态也能看到 Dock 容器的存在感，引导用户发现功能。

## Risks / Trade-offs

- **`:has()` 浏览器支持** → Safari 15.4+、Chrome 105+、Firefox 121+均已支持，目标用户覆盖足够
- **拖拽过程中的样式干扰** → drag 状态下禁用鱼眼效果，仅显示拖拽占位指示
- **Dock 栏在背景图模式下的可读性** → 通过 `--widget-bg` 变量自动切换为更深的半透明底色
