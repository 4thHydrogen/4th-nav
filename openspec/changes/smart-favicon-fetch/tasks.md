## 1. goscraper 多候选收集

- [x] 1.1 在 `DocumentPreview` 中新增 `Icons []IconCandidate` 字段，定义 `IconCandidate` 结构体（URL、Sizes、Type、Rel）
- [x] 1.2 改造 `parseDocument`：遍历 HTML 时收集所有 `<link rel="icon">` 和 `<link rel="apple-touch-icon">` 到候选列表，保留 sizes/type 属性
- [x] 1.3 实现 `SelectBestIcon()` 方法：按 SVG > 高尺寸 PNG > ICO 优先级排序，返回最优候选
- [x] 1.4 改造 `getIcon()` 调用：使用 `SelectBestIcon()` 的结果替代原来的单一 icon

## 2. 后端品牌预设

- [x] 2.1 新建 `service/brand-presets.go`：定义域名 → SVG 路径的 `map[string]string`，数据从 `icon-presets.ts` 同步
- [x] 2.2 实现 `MatchBrandPreset(url string) string` 函数：提取主域名，查预设表，返回 SVG 路径或空字符串
- [x] 2.3 在 `LazyFetchLogo` 开头调用 `MatchBrandPreset`，命中时直接 `UpdateToolIcon` 并 return

## 3. 常见路径探测

- [x] 3.1 实现 `probeCommonIconPaths(baseURL string) string`：对目标域名发 HEAD 请求探测 `/apple-touch-icon.png`、`/apple-touch-icon-precomposed.png`、`/favicon-192x192.png`
- [x] 3.2 在 `LazyFetchLogo` 中 goscraper 无结果时调用路径探测

## 4. Google Favicon API 兜底

- [x] 4.1 实现 `fetchGoogleFavicon(domain string) string`：调用 `https://www.google.com/s2/favicons?domain=<domain>&sz=128`，超时 5s
- [x] 4.2 在 `LazyFetchLogo` 中所有策略失败后调用 Google API 兜底，成功时缓存结果

## 5. 整合与验证

- [x] 5.1 重构 `LazyFetchLogo` 为流水线：预设查询 → goscraper 多候选选择 → 路径探测 → Google API 兜底
- [ ] 5.2 验证：添加 jd.com，确认获取到高质量图标而非模糊 ICO
- [ ] 5.3 验证：添加 github.com，确认命中品牌预设直接返回 SVG
