## Why

后端 `LazyFetchLogo` 获取 favicon 时只取网页中第一个 `<link rel="icon">`，不对比多个候选，导致很多网站拿到低质量 ICO（16x16 或 32x32），在 48px+ 的图标展示位上模糊不清。同时品牌预设（icon-presets.ts）只在前端生效，后端完全不知道有这 293 个高质量 SVG 可用，"重置默认图标"时无法利用预设。

## What Changes

- **后端图标获取策略升级**：goscraper 收集网页中所有 icon 声明（含 sizes 属性），按 SVG > 大尺寸 PNG > ICO 优先级排序，选最优图标
- **后端品牌预设匹配**：将前端 icon-presets.ts 的域名-图标映射同步到 Go 后端，`LazyFetchLogo` 优先使用预设的高质量 SVG
- **常见高分辨率路径探测**：对 `/apple-touch-icon.png`、`/apple-touch-icon-precomposed.png` 等常见路径做 HEAD 请求探测
- **可选外部 API 兜底**：以上策略都无结果时，调用 Google Favicon API (`google.com/s2/favicons?domain=...&sz=128`) 作为最终兜底，获取结果缓存到本地数据库

## Capabilities

### New Capabilities
- `favicon-priority-select`: favicon 多候选收集与优先级排序策略
- `backend-brand-preset`: 后端品牌预设域名匹配（与前端 icon-presets.ts 同步）

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- `goscraper/goscraper.go`：解析逻辑从"取最后一个"改为"收集所有 + 排序"
- `service/image.go`：`LazyFetchLogo` 增加预设查询、路径探测、外部 API 兜底
- 新增 `service/brand-presets.go`：后端品牌预设数据（从 icon-presets.ts 同步）
- 前端无改动（图标展示逻辑不变，只是后端返回的 logo 质量更高了）
