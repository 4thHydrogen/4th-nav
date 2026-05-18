## Why

当前搜索交互中，搜索引擎以卡片形式混在本地工具搜索结果里展示，用户无法主动选择引擎，且搜索引擎卡片占据了搜索结果的空间。需要一个更直观的引擎选择器，让用户在搜索栏内直接选择搜索引擎，按 Enter 即可用指定引擎搜索。

## What Changes

- 搜索栏右侧新增圆形引擎选择按钮，显示当前引擎首字母（如 B/G），点击弹出下拉菜单切换引擎
- 引擎选择持久化到 localStorage，刷新页面后保持
- Enter 键行为变更：从"打开搜索结果第一项"改为"用当前选中引擎搜索输入内容，在新标签页打开"
- 移除搜索引擎卡片（`generateSearchEngineCard` 生成的 ToolItem 卡片不再混入搜索结果）
- 本地工具实时过滤行为不变

## Capabilities

### New Capabilities
- `search-engine-selector`: 搜索栏内的引擎选择器组件，包含圆形按钮、下拉菜单、引擎状态持久化、Enter 键搜索触发

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **前端组件**：`SearchBar` 组件新增引擎选择器 UI
- **前端逻辑**：`useSearch` hook 移除 searchEngineCards 逻辑；`useKeyboardNavigation` hook 修改 Enter 键行为
- **工具函数**：`searchEngine.ts` 移除 `generateSearchEngineCard`，保留 `getEnabledSearchEngines` 和新增 `generateSearchUrl` 导出
- **状态管理**：新增 selectedEngine 状态，持久化到 localStorage
- **无后端变更**
