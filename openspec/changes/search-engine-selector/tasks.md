## 1. 清理旧逻辑

- [x] 1.1 从 `Content/hooks.ts` 的 `useSearch` 中移除 `searchEngineCards` state 和 `generateSearchEngineCard` 调用，`filteredData` 只包含本地工具过滤结果
- [x] 1.2 从 `utils/searchEngine.ts` 中移除 `generateSearchEngineCard` 函数（保留 `getEnabledSearchEngines`、`clearSearchEngineCache`，将 `generateSearchUrl` 改为 export）

## 2. 搜索栏引擎选择器 UI

- [x] 2.1 在 `SearchBar/index.tsx` 中添加引擎状态管理：`useEffect` 加载引擎列表 + `useState` 管理 selectedEngine + localStorage 持久化
- [x] 2.2 在 `SearchBar/index.tsx` 中添加圆形引擎按钮 JSX（显示首字母，位于 input 右侧、search-hint 之前）
- [x] 2.3 在 `SearchBar/index.tsx` 中添加下拉菜单 JSX（列出所有引擎，当前选中项高亮，点击外部关闭）
- [x] 2.4 在 `SearchBar/index.css` 中添加按钮和下拉菜单样式（圆形按钮、absolute 定位下拉、hover/active 状态、选中高亮）

## 3. Enter 键行为修改

- [x] 3.1 修改 `Content/hooks.ts` 的 `useKeyboardNavigation`：接收 selectedEngine 参数，Enter 键用选中引擎拼接 URL 并 `window.open`，然后 `resetSearch`

## 4. 联调与验证

- [x] 4.1 验证引擎选择持久化：刷新页面后引擎选择保持
- [x] 4.2 验证 Enter 搜索：输入内容后 Enter 用选中引擎打开搜索
- [x] 4.3 验证本地工具过滤：输入搜索词时只显示本地工具，无搜索引擎卡片
