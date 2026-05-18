## 1. 搜索栏布局重构

- [x] 1.1 重构 `SearchBar/index.css`：`.search-wraper` 成为视觉容器，添加毛玻璃背景（`backdrop-filter: blur(12px)` + `background: rgba(255,255,255,0.12)`）、胶囊圆角（`border-radius: 9999px`）、内边距
- [x] 1.2 修改 `SearchBar/index.css`：input 移除独立背景/边框/圆角，设为透明背景，仅保留 focus 样式
- [x] 1.3 修改 `SearchBar/index.css`：搜索图标样式调整，使用 `color: var(--widget-text-muted)` + 适当 margin

## 2. JSX 结构调整

- [x] 2.1 修改 `SearchBar/index.tsx`：移除 `<span className="search-hint">/</span>` 元素
- [x] 2.2 清理 `SearchBar/index.css` 中 `.search-hint` 相关样式

## 3. 主题适配

- [x] 3.1 修改 `Content/index.css` 中 `.desktop-search-shell` 相关样式：移除 input 的独立背景规则，改为 `.search-wraper` 的背景规则
- [x] 3.2 适配深色模式（`body.dark-mode`）和有背景图模式（`body.has-background`、`body.glassmorphism`）下搜索栏的毛玻璃样式

## 4. 验证

- [x] 4.1 验证胶囊外形：搜索栏两侧为半圆
- [x] 4.2 验证毛玻璃效果：有背景图时搜索栏呈现磨砂玻璃
- [x] 4.3 验证元素位置：搜索图标在内部左侧，引擎按钮在内部右侧
- [x] 4.4 验证主题适配：浅色/深色/有背景图模式下均正常显示
