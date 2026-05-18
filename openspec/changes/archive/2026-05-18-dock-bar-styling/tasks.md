## 1. Dock 内部元素排布优化

- [x] 1.1 将 `.dock-bar` 的 `align-items` 从 `flex-end` 改为 `center`，`gap` 从 `10px` 调整为 `6px`
- [x] 1.2 添加 `--dock-icon-size: 40px` 局部变量，将 Dock 图标尺寸从 `var(--icon-size, 48px)` 改为 `var(--dock-icon-size, 40px)`
- [x] 1.3 调整 `.dock-bar` 的 padding 使其与缩小后的图标尺寸比例协调

## 2. Dock 容器毛玻璃背景

- [x] 2.1 为 `.dock-bar` 添加毛玻璃容器样式：`background: var(--widget-bg)` + `backdrop-filter: blur(18px)` + `border: 1px solid var(--widget-border)` + `box-shadow`
- [x] 2.2 为 `body.dark-mode` 和 `body.has-background`/`body.glassmorphism` 添加 Dock 容器的暗色/深色适配覆盖

## 3. 空态 Dock 优化

- [x] 3.1 修改空态 Dock 样式：也显示毛玻璃容器，内含引导图标（Plus 或 Dock 图标）+ 提示文字
- [x] 3.2 更新 `index.tsx` 中空态的 JSX 结构，添加装饰图标

## 4. 悬浮鱼眼放大效果

- [x] 4.1 在 CSS 中使用 `:hover` + 相邻兄弟选择器实现当前图标放大（1.3x）和邻居缩小（0.88x）
- [x] 4.2 在 drag 状态下禁用鱼眼效果（`.dragging` 时 `transform` 不受 hover 影响）

## 5. 拖拽视觉反馈优化

- [x] 5.1 优化拖拽占位指示样式：将 `margin-left`/`margin-right` 替换为更明显的视觉指示线或间距效果

## 6. 验证与收尾

- [x] 6.1 在浏览器中验证亮色、暗色、背景图三种模式下的 Dock 栏视觉效果
- [x] 6.2 验证拖拽排序功能不受样式改动影响
