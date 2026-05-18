## Why

左侧分类导航栏 (CategoryFilter) 当前常驻显示、88px 固定宽度，在中等屏幕或有背景图时占用过多可视面积。需要将其改为响应式折叠交互，在不使用时隐藏，释放内容区空间。

## What Changes

- **桌面端（>768px）**：CategoryFilter 默认收起为 4px 半透明边线，鼠标悬停展开 88px 完整分类列表（覆盖模式，不推挤内容），离开后 1s 延迟收起
- **Tab 键固定**：按 Tab 键可切换侧栏固定展开/取消固定
- **移动端（<=768px）**：取消顶部横排分类栏，改为左上角浮动按钮，点击弹出下拉菜单（含分类列表 + 管理后台入口）
- **设置按钮分离**：桌面端齿轮图标从侧栏独立出来，固定在 viewport 左下角；移动端整合进下拉菜单底部

## Capabilities

### New Capabilities
- `collapsible-category-sidebar`: 桌面端可折叠左侧分类导航（悬停展开、Tab固定、覆盖模式、1s延迟收起）
- `mobile-category-menu`: 移动端浮动按钮 + 下拉分类菜单（含管理后台入口）

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **前端组件**：`CategoryFilter/index.tsx` 和 `CategoryFilter/index.css` 需要大幅重写
- **布局**：`Content/index.css` 中 `.desktop-page` 的 `padding-left` 从 96px 改为 0（桌面端侧栏覆盖模式），移动端也移除顶部 padding
- **状态管理**：需要新增 Zustand 或 useState 管理"是否固定展开"状态
- **键盘事件**：`Content/hooks.ts` 中的 `useKeyboardNavigation` 需要协调 Tab 键的冲突（当前 Tab 用于导航，需要换键或增加修饰键）
- **Settings 按钮位置**：需要新增独立的 SettingsIcon 组件或在现有组件中提取
