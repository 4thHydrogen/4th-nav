# Spec: 统一浮层系统与交互修复

## 背景

当前 4th-nav 首页存在多个浮层交互问题：文件夹浮窗快速打开/关闭后出现幽灵 hover、搜索引擎下拉菜单被 icon 卡片遮挡、页面缩放时浮窗无法打开。根因是各浮层组件独立管理 z-index、定位和关闭逻辑，缺乏统一基础设施。

## 用户故事

### US1: 统一浮层基础设施（P1）

作为开发者，我需要一个通用的浮层基础设施，使所有浮动 UI（文件夹浮窗、搜索引擎菜单、右键菜单）走同一个 Portal 渲染、z-index 层级和外部点击关闭机制。

**验收标准**:
- 所有浮层通过 `createPortal` 挂载到 `#app-overlay-root`
- 所有浮层使用统一 z-index token（CSS 变量）
- outside click 使用 `pointerdown` capture 阶段判断
- 每个浮层有明确状态：`closed` → `opening` → `open` → `closing`
- 快速连续点击同一 anchor 10 次不产生残留状态
- Escape 键关闭当前最上层浮层
- 路由变化时关闭所有浮层

### US2: 文件夹浮窗 Portal 迁移与状态统一（P1）

作为用户，我期望文件夹浮窗在任何缩放级别下都能正常打开和关闭，快速操作不会产生幽灵 hover。

**验收标准**:
- 文件夹浮窗通过 FloatingPortal 渲染到 body
- 状态简化为单一来源：`FolderOverlayState | null`
- 使用 viewport 坐标定位，不依赖 gridRect
- 浮窗打开时主内容区不响应 hover（pointer-events: none 或 inert）
- 页面缩放到 50%/33%/25% 时仍能打开浮窗
- 窗口始终小于 viewport，不产生横向滚动

### US3: 搜索引擎菜单 Portal 迁移（P2）

作为用户，我期望搜索引擎下拉菜单不被主页 icon 卡片遮挡，能从按钮位置正确展开。

**验收标准**:
- 菜单通过 FloatingPortal 渲染到 body
- 菜单优先出现在按钮右侧（placement: right-start）
- fallback 到 bottom-end / left-start
- 动画从按钮右侧展开（scaleX: 0.2→1, transformOrigin: left center）
- 点击外部关闭、Escape 关闭
- 小屏/缩放下不超出 viewport

### US4: 状态清理与代码整理（P3）

作为开发者，我期望 `ui.ts` 中重复或过时的浮层状态字段被整理，不再有两套文件夹浮窗逻辑并存。

**验收标准**:
- `FolderPopupPanel` 目录标记为 deprecated 或删除
- `ui.ts` 中 `popupPanel` 和 `expandedFolderId` 统一为单一状态
- 不存在局部 `z-index: 9999` 硬编码
