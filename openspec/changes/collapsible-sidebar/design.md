## Context

当前 CategoryFilter 组件以 `position: fixed; left: 0; width: 88px` 常驻显示在页面左侧，`.desktop-page` 的 `padding-left: 96px` 为其留出空间。移动端（<=768px）下变为顶部横排滚动条。管理后台入口（齿轮图标）集成在侧栏底部。

需要改为响应式折叠交互，释放内容区空间。

## Goals / Non-Goals

**Goals:**
- 桌面端默认收起，鼠标悬停展开（覆盖模式）
- Tab 键可固定展开状态
- 移动端改为左上角按钮 + 下拉菜单
- 设置按钮从侧栏独立出来
- 保持现有分类过滤功能不变
- 保持无障碍可访问性

**Non-Goals:**
- 不改变分类数据结构和 API
- 不改变移动端以下的其他布局
- 不引入新的第三方动画库（使用 CSS transition + Framer Motion 已在项目中）
- 不改变 DesktopCategorySection（内容区内的分类展示）

## Decisions

### 1. 展开模式：覆盖（overlay）而非推挤（push）

侧栏展开时通过 `z-index` 覆盖在内容上方，不改变 `.desktop-page` 的 `padding-left`。

**理由**：避免 layout reflow 导致的抖动和重排开销。内容区始终 `padding-left: 0`，最大化可视面积。

**替代方案**：push 模式动态改变 padding — 会导致内容区重排，对有背景图的场景视觉效果差。

### 2. 桌面端收起状态：4px 触发边线

收起时显示 4px 半透明边线（`::before` 伪元素），高度 100vh。当前选中分类位置有一条亮色短线段作为视觉暗示。

**理由**：极简、不干扰内容，但仍有视觉线索。比完全隐藏（0px）发现性更好。

### 3. 移动端：左上角浮动按钮 + 下拉菜单

左上角放置一个 40x40px 的浮动按钮（分类图标），点击弹出下拉菜单显示分类列表和管理后台入口。菜单带半透明遮罩，点击遮罩或选择分类后关闭。

**理由**：移动端屏幕空间宝贵，左上角是自然的导航入口位置（符合拇指热区）。下拉菜单比顶部横排更节省空间。

### 4. 设置按钮独立为 SettingsIcon 组件

桌面端：`position: fixed; left: 12px; bottom: 16px`，37x37 圆角方块。
移动端：整合进下拉菜单底部。

**理由**：设置是低频操作，不需要常驻占用侧栏空间。独立出来后侧栏收起时仍可访问。

### 5. Tab 键固定：使用 Ctrl+Tab 或独立的快捷键

在 `Content/hooks.ts` 的 `useKeyboardNavigation` 中增加 `Escape` 或 `Ctrl+/` 快捷键来固定/取消侧栏。

**理由**：Tab 键在浏览器中有默认的焦点遍历行为，直接拦截可能影响可访问性。使用修饰键更安全。具体快捷键待确认 — 建议用 `Escape` 键（在无搜索内容时）或 `[` 键。

### 6. 状态管理：使用 useState 而非 Zustand

"是否固定展开"是纯 UI 局部状态，不需要全局共享，使用 CategoryFilter 组件内的 `useState` 即可。

**理由**：遵循项目现有模式 — Zustand 管理跨组件共享状态（如 selectedCategories），useState 管理组件内部状态。

## Risks / Trade-offs

- **[发现性]** 4px 边线可能被用户忽略 → 选中分类位置的亮色短线 + hover 时边线颜色加深来引导
- **[Tab 键冲突]** Tab 的浏览器默认行为与固定功能冲突 → 使用修饰键或替代按键
- **[移动端下拉菜单与搜索框重叠]** 左上角按钮和搜索框可能在移动端视觉冲突 → 按钮放在搜索框下方或调整位置
- **[性能]** 频繁的 translateX 动画 → 使用 `will-change: transform` 和 GPU 加速
