## ADDED Requirements

### Requirement: IconPicker 统一搜索
IconPicker SHALL 提供搜索框，用户输入关键词后 SHALL 同时搜索所有本地图标来源：静态图标文件、内置 SVG 图标、以及用户已使用的图标。

#### Scenario: 搜索品牌图标
- **WHEN** 用户在 IconPicker 搜索框中输入 "github"
- **THEN** 显示 GitHub 品牌图标（来自静态文件）

#### Scenario: 搜索中文名称
- **WHEN** 用户在 IconPicker 搜索框中输入 "代码"
- **THEN** 显示代码相关的图标（来自分类图标）

#### Scenario: 搜索英文名称
- **WHEN** 用户在 IconPicker 搜索框中输入 "music"
- **THEN** 显示音乐相关的图标

#### Scenario: 无匹配结果
- **WHEN** 用户输入的关键词没有匹配到任何图标
- **THEN** 显示空状态提示"未找到匹配的图标"

### Requirement: 搜索不依赖外部服务
IconPicker 的搜索功能 SHALL 仅搜索本地可用的图标资源，SHALL NOT 在用户输入时发起网络请求。

#### Scenario: 离线环境搜索
- **WHEN** 用户在完全离线的环境中使用 IconPicker 搜索
- **THEN** 搜索功能正常工作，因为所有搜索数据都是本地的
