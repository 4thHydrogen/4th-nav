## ADDED Requirements

### Requirement: 品牌预设覆盖主流服务
icon-presets SHALL 包含至少 200 个品牌/服务的域名匹配预设，覆盖国际品牌、国内品牌、开发工具和自部署服务四大类别。

#### Scenario: 添加国际品牌网站
- **WHEN** 用户添加 URL 为 `https://twitter.com/...` 或 `https://x.com/...` 的工具
- **THEN** 系统自动匹配到 X/Twitter 的品牌图标

#### Scenario: 添加国内品牌网站
- **WHEN** 用户添加 URL 为 `https://www.zhihu.com/...` 的工具
- **THEN** 系统自动匹配到知乎的品牌图标

#### Scenario: 添加自部署服务
- **WHEN** 用户添加 URL 为 `https://portainer.myserver.local` 的工具
- **THEN** 系统自动匹配到 Portainer 的品牌图标

### Requirement: 所有预设图标为 SVG 格式
icon-presets 中引用的所有图标文件 SHALL 为 SVG 格式。现有的 PNG 品牌图标 SHALL 被替换为等效的 SVG 文件。

#### Scenario: 替换现有 PNG 图标
- **WHEN** 系统部署后，原有的 github.png、bilibili.png 等 PNG 文件已被对应 SVG 替换
- **THEN** 所有预设图标在高分辨率屏幕上显示清晰锐利

### Requirement: 域名匹配优先级
当多个预设规则可能匹配同一个域名时，SHALL 优先匹配更精确（更长）的域名。

#### Scenario: 子域名匹配
- **WHEN** 用户添加 URL 为 `https://pan.baidu.com/...` 的工具
- **THEN** 系统匹配到 `pan.baidu.com` 的百度网盘图标，而非 `baidu.com` 的通用百度图标
