## Context

当前搜索引擎功能通过 `generateSearchEngineCard()` 将启用的搜索引擎（百度/Bing/Google）转换为 `Tool[]` 卡片，混入 `filteredData` 与本地工具一起渲染。用户无法主动选择引擎，Enter 键打开 `filteredData[0]` 的 URL（可能是本地工具也可能是搜索引擎卡片）。

搜索引擎数据通过 `getEnabledSearchEngines()` 从后端获取，带 5 分钟缓存。`SearchEngine` 类型已定义完整（id, name, baseUrl, queryParam, logo, sort, enabled）。

状态管理现状：Zustand 管理客户端 UI 状态（`stores/ui.ts`），React Query 管理服务端状态。

## Goals / Non-Goals

**Goals:**
- 搜索栏内集成引擎选择器，圆形按钮 + 下拉菜单
- 引擎选择持久化，刷新页面后保持
- Enter 键用选中引擎搜索
- 移除搜索引擎卡片混入搜索结果的行为

**Non-Goals:**
- 搜索引擎图标真实加载（当前用大写首字母占位，后续单独处理）
- 搜索引擎的增删改（由后台管理页面负责，不在本次范围）
- Ctrl+1/2/3 快捷键行为变更（保留现有逻辑，作用于本地工具结果）
- 后端 API 变更

## Decisions

### 1. 引擎选择器状态位置：localStorage 直接管理

**选择**：在 `SearchBar` 组件内部用 `useState` + `localStorage` 管理 selectedEngine，不提升到 Zustand store。

**理由**：引擎选择是搜索栏的局部关注点，不需要跨组件共享。Zustand store 适合全局 UI 状态（右键菜单、分类过滤等），引擎选择器只有 SearchBar 自身消费。

**替代方案**：提升到 `stores/ui.ts` — 过度设计，没有其他组件需要读取这个状态。

### 2. 引擎列表获取时机：随 SearchBar 组件加载

**选择**：在 SearchBar 组件 `useEffect` 中调用 `getEnabledSearchEngines()`，组件挂载时一次性加载。

**理由**：引擎列表变化频率极低（管理员偶尔修改），5 分钟缓存已足够。复用现有的 `getEnabledSearchEngines()` 和缓存机制。

### 3. 下拉菜单实现：纯 CSS + React state

**选择**：用 `useState` 控制 `isOpen`，纯 CSS 定位下拉菜单，点击外部关闭（`useEffect` + `mousedown` 监听）。

**理由**：一个简单的下拉菜单不值得引入 headless UI 或 popover 库。原生实现完全可控，代码量少。

### 4. Enter 键行为：在 useKeyboardNavigation 中修改

**选择**：修改 `useKeyboardNavigation` hook，Enter 键接收当前 selectedEngine，拼接 URL 并 `window.open`。

**理由**：键盘导航逻辑已经在此 hook 中，Enter 处理也在这里。只需传入 selectedEngine 参数即可，无需新建 hook。

### 5. 移除 searchEngineCards 逻辑

**选择**：从 `useSearch` hook 中移除 `searchEngineCards` state 和 `generateSearchEngineCard` 调用，`filteredData` 只包含本地工具过滤结果。

**理由**：搜索引擎卡片不再需要以 ToolItem 形式展示，清理干净避免死代码。

## Risks / Trade-offs

**[风险] 引擎列表加载失败时无下拉选项** → 缓解：`getEnabledSearchEngines` 已有 fallback 默认引擎（百度/Bing/Google），不会出现空列表。

**[取舍] 首字母占位不美观** → 接受：用户已确认后续单独处理图标加载，当前 MVP 用首字母即可。

**[风险] 下拉菜单定位在极端视口尺寸下溢出** → 缓解：下拉菜单使用 `position: absolute` + `right: 0` 锚定到按钮右对齐，正常视口不会溢出。移动端如需适配可后续调整。
