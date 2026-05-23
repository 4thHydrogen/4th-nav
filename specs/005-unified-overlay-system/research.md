# Research: 统一浮层系统

## 决策 1: 浮层状态管理方式

**Decision**: 使用 Zustand store 统一管理所有浮层状态，替代分散在 `ui.ts` 中的 `popupPanel`、`expandedFolderId` 和各组件内部 state。

**Rationale**:
- 当前 `useUIStore` 已使用 Zustand
- 浮层状态需要跨组件访问（WidgetGrid、SearchBar、ContextMenu）
- 状态机转换（closed → opening → open → closing）需要单一来源
- `instanceId` 防止快速点击时旧动画回调误关闭新浮层

**Alternatives considered**:
- React Context：需要 Provider 包裹，层级深时不方便
- 各组件内部 state：当前方式，导致状态分散和竞态

## 决策 2: Portal 渲染目标

**Decision**: 新增 `<div id="app-overlay-root">` 到 `index.html`，所有浮层通过 `createPortal` 挂载到该容器。

**Rationale**:
- 当前 FolderPopupPanel、ToolContextMenu、FolderOverlay 都直接 portal 到 `document.body`
- 统一容器允许全局 pointer-events 控制（方案 B）
- 不影响现有 portal 组件（只需改目标）

**Alternatives considered**:
- 继续直接 portal 到 body：可行但无法统一 pointer-events 控制

## 决策 3: outside click 机制

**Decision**: 使用 `pointerdown` 的 capture 阶段，配合 `useOutsidePointerDown` hook。

**Rationale**:
- `mousedown` 在某些浏览器/设备上不如 `pointerdown` 可靠
- capture 阶段在子元素 handler 之前触发，更可靠
- 统一 hook 避免各组件重复实现

**Alternatives considered**:
- 继续用 `mousedown`：当前方式，但存在事件冒泡问题

## 决策 4: 文件夹浮窗现有组件处理

**Decision**: 保留 `FolderFloatingWindow` 作为浮窗 UI 组件，废弃 `FolderPopupPanel`。DesktopCategorySection 迁移到 FolderFloatingWindow。

**Rationale**:
- `FolderFloatingWindow` 功能更完整（viewMode toggle、drag-out、framer-motion 动画）
- `FolderPopupPanel` 使用旧样式，功能重复
- DesktopCategorySection 是唯一使用 FolderPopupPanel 的地方

**Alternatives considered**:
- 保留两套：导致维护负担
- 合并为一个：FolderFloatingWindow 已经更好

## 决策 5: 搜索引擎菜单 placement

**Decision**: 使用简单的 CSS + JS 计算实现 placement，不引入 floating-ui 等外部库。

**Rationale**:
- 当前项目无 floating-ui 依赖
- 只需要 right-start + fallback to bottom-end，逻辑简单
- 避免 bundle size 增加

**Alternatives considered**:
- floating-ui 库：功能强大但引入新依赖
- Radix Popover：同样引入新依赖

## 决策 6: hover 泄漏处理方案

**Decision**: 方案 B — 用 class 禁止主区域 pointer events，保留浮层可交互。

**Rationale**:
- `inert` 属性兼容性需要检查
- 方案 B 更细粒度，可以保留某些元素的交互
- 已有 CSS 类模式（body.overlay-open）

**Alternatives considered**:
- 方案 A（inert 属性）：更简单但兼容性和控制粒度不如方案 B
