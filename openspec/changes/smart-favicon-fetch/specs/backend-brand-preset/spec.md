## ADDED Requirements

### Requirement: 后端品牌预设域名匹配
后端 SHALL 维护一份域名到 SVG 图标路径的映射表。`LazyFetchLogo` 在执行抓取前 SHALL 先查询此映射表，匹配成功时直接使用预设的 SVG 路径，跳过所有抓取逻辑。

#### Scenario: 添加预设品牌网站
- **WHEN** 用户添加 `https://github.com/username` 作为工具
- **THEN** `LazyFetchLogo` 匹配到 `github.com` 域名，直接使用 `/static/icons/brand/github.svg`，不发起任何网络请求

#### Scenario: 添加非预设网站
- **WHEN** 用户添加 `https://example.com` 作为工具
- **THEN** `LazyFetchLogo` 未匹配到预设，继续执行 goscraper 抓取流程

### Requirement: 预设数据与前端同步
后端预设数据 SHALL 与前端 `icon-presets.ts` 中的映射保持一致。新增品牌时必须同步更新两端。

#### Scenario: 前端新增品牌预设
- **WHEN** 前端 icon-presets.ts 新增了 `taobao.com → taobao.svg` 映射
- **THEN** 后端 brand-presets.go 也必须包含 `taobao.com → /static/icons/brand/taobao.svg` 条目

### Requirement: 预设匹配使用主域名
匹配 SHALL 基于提取的注册域名（如 `www.jd.com` → `jd.com`），支持子域名自动匹配。

#### Scenario: 带子域名的 URL
- **WHEN** 工具 URL 为 `https://www.jd.com/` 或 `https://item.jd.com/product/123`
- **THEN** 提取主域名 `jd.com`，匹配预设中 `jd.com` 对应的图标

#### Scenario: 域名完全匹配
- **WHEN** 工具 URL 为 `https://github.com/`
- **THEN** 直接匹配 `github.com`
