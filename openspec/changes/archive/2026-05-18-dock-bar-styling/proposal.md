## Why

DockBar 当前背景为 `transparent`，没有任何视觉容器样式——图标悬浮在页面底部，与背景之间缺少视觉层次分离。同时内部元素排布不够精致：图标底部对齐（`flex-end`）导致放大时向上溢出、间距固定无法适配放大效果、空态提示只是裸文字。macOS 风格 Dock 栏是导航站的核心视觉元素，需要为其添加毛玻璃容器、优化内部排布、实现鱼眼动效和暗色/背景图模式适配。

## What Changes

- 为 DockBar 添加毛玻璃（glassmorphism）背景容器：半透明白色/深色底 + `backdrop-filter: blur` + 微弱边框
- 优化 Dock 内部元素排布：图标居中对齐、间距自适应放大效果、图标尺寸缩小为 40px 以适配容器比例
- 空态提示优化：为空态 Dock 添加毛玻璃容器和图标装饰，提升引导感
- 悬停放大动效优化：邻居图标连带缩小（"鱼眼"效果），形成 macOS Dock 的经典视觉
- 暗色模式适配：dark-mode 和 has-background/glassmorphism 下的背景色/边框自动切换
- Dock 栏背景跟随项目已有的 `--widget-*` CSS 变量体系，保持全局视觉一致性
- 拖拽排序时的视觉反馈优化：占位指示线/区域

## Capabilities

### New Capabilities

- `dock-bar-visual`: Dock 栏视觉样式——毛玻璃容器、内部元素排布优化、悬浮放大动效（鱼眼）、暗色模式适配、拖拽视觉反馈

### Modified Capabilities

（无已有 spec 需要修改）

## Impact

- 前端文件：`ui/src/components/DockBar/index.css`（主要改动）、`ui/src/components/DockBar/index.tsx`（空态结构调整、图标尺寸调整）
- CSS 变量：复用 `--widget-bg`、`--widget-border`、`--widget-shadow` 等，新增 `--dock-icon-size` 局部变量控制 Dock 图标尺寸
- 不影响后端、API 或数据库
- 不影响 Dock 的拖拽排序逻辑，仅影响视觉表现和内部排布
