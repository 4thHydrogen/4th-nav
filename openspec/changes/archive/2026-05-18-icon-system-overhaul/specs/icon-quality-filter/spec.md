## ADDED Requirements

### Requirement: favicon 尺寸检查
goscraper 抓取网站 favicon 时，SHALL 检查图标的实际分辨率。分辨率低于 64x64 像素的图标 SHALL 被弃用，系统 SHALL 返回空值，让前端显示首字母 fallback。

#### Scenario: 抓取到高质量 PNG favicon
- **WHEN** goscraper 抓取到一个 128x128 或更大尺寸的 PNG favicon
- **THEN** 系统正常使用该图标

#### Scenario: 抓取到低质量 favicon
- **WHEN** goscraper 抓取到一个 16x16 或 32x32 的 favicon
- **THEN** 系统弃用该图标，返回空值，前端显示首字母 fallback

#### Scenario: 抓取到 SVG favicon
- **WHEN** goscraper 抓取到一个 SVG 格式的 favicon
- **THEN** 系统直接使用该 SVG，不进行分辨率检查（矢量图任何尺寸都清晰）

#### Scenario: 无法解析图标尺寸
- **WHEN** goscraper 下载了图标数据但无法解析其尺寸（格式不识别）
- **THEN** 系统按"质量未知"处理，允许使用该图标

### Requirement: 已知品牌跳过 favicon 抓取
当用户添加的工具 URL 匹配到 icon-presets 中的品牌域名时，系统 SHALL 直接使用预设图标，SHALL NOT 抓取该网站的 favicon。

#### Scenario: 添加 GitHub 工具
- **WHEN** 用户添加 URL 为 `https://github.com/user/repo` 的工具
- **THEN** 系统使用预设的 GitHub SVG 图标，不去抓取 github.com 的 favicon

#### Scenario: 添加未知网站工具
- **WHEN** 用户添加 URL 为 `https://random-site.example.com` 的工具，该域名不在预设中
- **THEN** 系统尝试抓取该网站的 favicon（带分辨率过滤）
