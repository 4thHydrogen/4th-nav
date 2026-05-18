## ADDED Requirements

### Requirement: 代理设置存储
系统 SHALL 在 nav_setting 表中存储一个代理 URL 字符串。代理为空时表示直连，不为空时所有图标获取请求通过该代理。

#### Scenario: 设置代理
- **WHEN** 管理员在设置页填写代理地址 `http://127.0.0.1:7890` 并保存
- **THEN** 代理地址被存入数据库，后续所有图标获取请求使用该代理

#### Scenario: 清空代理
- **WHEN** 管理员将代理地址清空并保存
- **THEN** 后续图标获取请求恢复直连

### Requirement: 图标获取 HTTP 请求使用代理
goscraper 抓取网页、favicon 质量检查、路径探测、Google Favicon API 兜底的所有 HTTP 请求 SHALL 使用已配置的代理。

#### Scenario: 配置了代理后获取图标
- **WHEN** 代理已配置为 `http://127.0.0.1:7890`，用户添加新工具
- **THEN** goscraper、路径探测、Google API 的所有请求通过 `127.0.0.1:7890` 代理

#### Scenario: 未配置代理
- **WHEN** 代理为空
- **THEN** 所有请求直连，行为与之前一致

### Requirement: 前端管理设置页显示代理输入框
管理后台设置页 SHALL 显示代理地址输入框，允许管理员填写和保存代理 URL。

#### Scenario: 设置页展示代理配置
- **WHEN** 管理员打开设置页
- **THEN** 可以看到代理地址输入框，显示当前保存的代理值
