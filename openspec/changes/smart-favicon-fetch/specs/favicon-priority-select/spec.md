## ADDED Requirements

### Requirement: goscraper 收集所有 icon 候选
goscraper 的 `parseDocument` SHALL 收集网页中所有 `<link rel="icon">` 和 `<link rel="apple-touch-icon">` 声明，包括 href 和 sizes 属性，存入候选列表。

#### Scenario: 网页声明多个 icon
- **WHEN** 目标网页包含多个 `<link rel="icon">` 标签（如 32x32 PNG、16x16 ICO、SVG）
- **THEN** goscraper 将所有声明收集为候选列表，每个候选包含 URL、sizes、type 信息

#### Scenario: 网页声明 apple-touch-icon
- **WHEN** 目标网页包含 `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
- **THEN** apple-touch-icon 也被纳入候选列表

#### Scenario: 网页无 icon 声明
- **WHEN** 目标网页 HTML 中没有任何 icon 相关的 link 标签
- **THEN** goscraper 退回到默认行为，尝试 `/favicon.ico`

### Requirement: 候选图标优先级排序
系统 SHALL 对收集到的所有 icon 候选按优先级排序，选择最优图标。优先级规则：SVG > PNG > ICO，同类型中尺寸大的优先。

#### Scenario: 有 SVG 也有 ICO
- **WHEN** 候选列表包含 `favicon.svg` 和 `favicon.ico`
- **THEN** 优先选择 SVG

#### Scenario: 多个 PNG 不同尺寸
- **WHEN** 候选列表包含 32x32 PNG 和 192x192 PNG
- **THEN** 优先选择 192x192 PNG

#### Scenario: 只有 ICO
- **WHEN** 候选列表只有一个 ICO 文件
- **THEN** 选择该 ICO

### Requirement: 常见高分辨率路径探测
当 goscraper 未找到任何 icon 候选时，系统 SHALL 对目标域名的以下路径做 HEAD 请求探测：`/apple-touch-icon.png`、`/apple-touch-icon-precomposed.png`、`/favicon-192x192.png`。

#### Scenario: HTML 无声明但存在 apple-touch-icon
- **WHEN** 网页 HTML 无 icon 声明，但服务器上存在 `/apple-touch-icon.png`
- **THEN** HEAD 请求返回 200，系统使用该路径作为图标

#### Scenario: 所有探测路径均不存在
- **WHEN** 所有探测路径返回 404 或超时
- **THEN** 跳过探测结果，进入下一策略

### Requirement: Google Favicon API 兜底
当预设匹配、goscraper 抓取、路径探测均无结果时，系统 SHALL 调用 Google Favicon API (`google.com/s2/favicons?domain=<domain>&sz=128`) 获取图标。

#### Scenario: 前面的策略都失败
- **WHEN** 预设无匹配、goscraper 无候选、路径探测无结果
- **THEN** 调用 Google Favicon API，将返回的图片缓存到 nav_img 表

#### Scenario: Google API 超时或不可用
- **WHEN** Google Favicon API 请求超时（5s）或返回错误
- **THEN** 静默跳过，不设置图标（显示首字母 fallback）
