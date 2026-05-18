## Context

Van Nav 后端 `LazyFetchLogo` 获取 favicon 的流程：goscraper 抓取网页 HTML → 解析 `<link rel="icon">` → 取最后一个匹配的 href → 下载并存入数据库。

问题：
1. 只取最后一个 icon 声明，不对比 sizes 属性，经常拿到低质量 ICO
2. 不探测 `/apple-touch-icon.png` 等高分辨率路径
3. 后端不感知品牌预设，前端 icon-presets.ts 的 293 个品牌 SVG 对后端无意义
4. 无外部 API 兜底

约束：Van Nav 是个人导航站，用户添加工具时必然在线。图标获取后缓存到 SQLite，展示时不依赖外部。

## Goals / Non-Goals

**Goals:**
- 后端获取 favicon 时从"取第一个"变为"收集所有候选，选最优"
- 后端品牌预设优先，命中预设时直接使用高质量 SVG，不走抓取
- 多路径探测增加找到高分辨率图标的机会
- 可选外部 API 兜底确保任何网站都能获得清晰图标

**Non-Goals:**
- 不改前端展示逻辑（tool.logo 字段不变，前端渲染不变）
- 不做定时自动刷新所有图标（本轮只在添加/重置时触发）
- 不引入新的运行时依赖或第三方 Go 库

## Decisions

### 决策 1：goscraper 收集所有 icon 声明并排序

**选择：** 改造 `parseDocument`，收集所有 `<link rel="icon">` 和 `<link rel="apple-touch-icon">`，解析 sizes 属性，按优先级排序返回

**优先级规则：**
1. SVG > PNG > ICO（矢量优先）
2. 同类型中尺寸大的优先（192 > 180 > 64 > 32 > 16）
3. apple-touch-icon 优先于普通 icon（通常分辨率更高）

**理由：** 现在只取最后一个，而 HTML 中图标声明顺序不固定。很多网站第一个声明的是小尺寸 ICO，后面才有 PNG。

**改动范围：** `goscraper/goscraper.go` 中 `DocumentPreview` 增加 `Icons []IconCandidate` 字段，`parseDocument` 收集所有候选，新增 `SelectBestIcon()` 方法

### 决策 2：后端品牌预设用 Go map 硬编码

**选择：** 新建 `service/brand-presets.go`，维护一个 `map[string]string`（域名 → SVG 路径）

**替代方案：** 从 icons.json 读取
**理由：** Go map 编译期确定，零 IO 开销。数据量约 300 条，硬编码完全可维护。与前端 icon-presets.ts 保持同步即可。

**改动范围：** 新增 `service/brand-presets.go`，`LazyFetchLogo` 开头增加预设查询

### 决策 3：常见路径探测用 HEAD 请求

**选择：** 对目标域名尝试 HEAD 请求以下路径：
- `/apple-touch-icon.png`
- `/apple-touch-icon-precomposed.png`
- `/favicon-192x192.png`
- `/android-chrome-192x192.png`

**理由：** 很多网站有这些文件但 HTML 中没有声明。HEAD 请求只检查存在性（200 且 Content-Type 为图片），不下载完整内容。

### 决策 4：Google Favicon API 作为可选兜底

**选择：** 当以上策略都无结果时，调用 `https://www.google.com/s2/favicons?domain=<domain>&sz=128`

**替代方案：** DuckDuckGo (`icons.duckduckgo.com/ip3/<domain>.ico`)
**理由：** Google API 支持指定尺寸参数（sz=128），返回 128x128 PNG。DuckDuckGo 不支持指定尺寸。

**可选性：** 不强制依赖。如果 Google API 请求失败（超时 5s），静默降级为空 logo（显示首字母 fallback）。不阻塞主流程。

## Risks / Trade-offs

- **goscraper 解析复杂度增加** → 收集多个候选增加少量 CPU 开销，但 favicon 抓取本身是 IO 密集型，CPU 影响可忽略
- **Google Favicon API 可能在某些地区不可用** → 静默降级，不影响主流程
- **品牌预设需要手动与前端同步** → 数据量约 300 条，变更不频繁，可接受
- **多路径探测增加请求次数** → 最多 4 个 HEAD 请求 + 超时 5s，异步执行不阻塞
