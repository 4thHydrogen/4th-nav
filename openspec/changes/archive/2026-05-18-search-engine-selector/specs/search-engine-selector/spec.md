## ADDED Requirements

### Requirement: Engine selector button in search bar
搜索栏右侧 SHALL 显示一个圆形按钮，展示当前选中搜索引擎名称的大写首字母。按钮位于搜索输入框右侧、快捷键提示 "/" 之前。

#### Scenario: Default engine display on page load
- **WHEN** 用户首次打开页面且 localStorage 中无引擎选择记录
- **THEN** 圆形按钮显示引擎列表中第一个引擎的大写首字母

#### Scenario: Persisted engine display on page load
- **WHEN** 用户打开页面且 localStorage 中存有上次的引擎选择
- **THEN** 圆形按钮显示该持久化引擎的大写首字母

### Requirement: Engine selection dropdown
点击引擎选择按钮 SHALL 弹出下拉菜单，列出所有已启用的搜索引擎。每个选项显示引擎名称的首字母标识。当前选中的引擎 SHALL 有视觉高亮。

#### Scenario: Open and close dropdown
- **WHEN** 用户点击引擎选择按钮
- **THEN** 下拉菜单出现，显示所有已启用的搜索引擎，当前选中项有高亮

#### Scenario: Select engine from dropdown
- **WHEN** 用户在下拉菜单中点击一个搜索引擎
- **THEN** 该引擎成为当前选中引擎，按钮首字母更新，选择持久化到 localStorage，下拉菜单关闭

#### Scenario: Close dropdown by clicking outside
- **WHEN** 下拉菜单已打开，用户点击菜单外部区域
- **THEN** 下拉菜单关闭，引擎选择不变

### Requirement: Enter key triggers search with selected engine
在搜索框有内容时按 Enter 键 SHALL 使用当前选中的搜索引擎打开搜索结果页面（新标签页），并清空搜索框。

#### Scenario: Search with selected engine
- **WHEN** 搜索框有内容且用户按下 Enter 键
- **THEN** 系统使用当前选中引擎的 baseUrl + queryParam 拼接搜索 URL，在新标签页打开，并清空搜索框

#### Scenario: Enter with empty search box
- **WHEN** 搜索框为空且用户按下 Enter 键
- **THEN** 不触发任何搜索行为

### Requirement: Engine selection persistence
用户选择的搜索引擎 SHALL 持久化到 localStorage，键名为 `selectedSearchEngineId`，值为引擎的 `id` 字段。

#### Scenario: Persistence on select
- **WHEN** 用户选择一个搜索引擎
- **THEN** 该引擎的 id 写入 localStorage 的 `selectedSearchEngineId` 键

#### Scenario: Restoration on page load
- **WHEN** 页面加载，localStorage 中存在 `selectedSearchEngineId` 且该 id 对应的引擎在已启用列表中
- **THEN** 自动选中该引擎

#### Scenario: Invalid persisted engine id
- **WHEN** 页面加载，localStorage 中的 `selectedSearchEngineId` 对应的引擎不存在或未启用
- **THEN** 回退到引擎列表中的第一个引擎

### Requirement: Remove search engine cards from search results
搜索结果中 SHALL 不再包含搜索引擎卡片。`filteredData` 仅包含本地工具的过滤结果。

#### Scenario: Search results show only local tools
- **WHEN** 用户输入搜索词
- **THEN** 搜索结果只显示匹配的本地工具，不出现搜索引擎卡片
