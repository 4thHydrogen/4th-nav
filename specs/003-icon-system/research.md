# Research: Icon 系统增强 — 高清获取与批量管理

**Feature**: 003-icon-system
**Date**: 2026-05-23

## 现有代码分析

### 当前 Pipeline

```
AddToolHandler / UpdateToolHandler
  → logo 为空时异步调用 service.LazyFetchLogo(url, id)
    → Step 1: MatchBrandPreset(rawURL)     — brand-presets.go (505行预设)
    → Step 2: getIcon(rawURL)               — goscraper 抓取 HTML + SelectBestIcon()
    → Step 3: probeCommonIconPaths(rawURL)  — HEAD 请求 4 个常见路径
    → Step 4: fetchGoogleFavicon(rawURL)    — Google API sz=128
    → UpdateToolIcon(id, logo)              — 更新 nav_table.logo + UpdateImg 缓存
```

### 关键文件

| 文件 | 职责 |
|------|------|
| `service/image.go` | icon 获取 pipeline、缓存读写 |
| `service/brand-presets.go` | 品牌预设（内联 map，505行） |
| `service/tools.go` | AddTool/UpdateTool/UpdateToolIcon |
| `handler/public.go` | GetLogoImgHandler（/api/img 读取缓存） |
| `handler/tool.go` | AddToolHandler 等触发异步获取 |
| `ui/src/utils/api.ts` | 前端 getLogoUrl() |

### 现有能力

- 品牌预设：已独立文件 `brand-presets.go`，内含 100+ 预设
- goscraper：使用第三方库抓取 HTML，调用 `SelectBestIcon()` 选择最佳
- 路径探测：只 HEAD 4 个路径（apple-touch-icon.png 等），不支持 SVG/ICO
- Google fallback：sz=128，已验证 content-type 和最小文件大小
- 图片质量检查：`checkIconQuality` 读取前 512 字节解析 PNG/JPEG 宽高
- 缓存：`nav_img` 表存 url(urlencoded) + value(base64)，无元数据

### 缺失能力

1. **无 Manifest 解析**：不解析 /manifest.json 或 /site.webmanifest
2. **无 HTML 全面解析**：goscraper 的 SelectBestIcon 不区分 rel 类型，不解析 og:image
3. **ICO 解析粗糙**：只读前 512 字节，无法选择 ICO 中最大尺寸
4. **路径探测不全**：只 4 个路径，缺 SVG/256/512 等高清路径，只用 HEAD
5. **无候选评分**：各步骤返回第一个有效结果即停止，不比较质量
6. **缓存无元数据**：nav_img 只有 url+base64，无 content-type/width/height
7. **/api/img 直接 404**：缓存未命中不尝试下载
8. **无批量管理 API**：无法批量刷新/重抓
9. **无任务状态**：异步获取无状态记录

## 技术决策

### Decision 1: 新增文件拆分

**选择**: 将 image.go 拆分为多个文件
- `service/icon_discovery.go` — 新的 discovery pipeline（含 manifest 解析、候选评分）
- `service/icon_job.go` — 批量任务管理（worker pool、状态追踪）
- `service/icon_cache.go` — 缓存层（FetchAndCacheImage、/api/img 补缓存）
- `service/image.go` — 保留原有函数，逐步迁移

**理由**: image.go 当前约 320 行，新增功能预计增加 400-600 行。拆分保持单文件 <800 行，职责清晰。

**替代方案**: 全部加在 image.go → 文件过长，职责混乱。

### Decision 2: 候选评分 vs 顺序 pipeline

**选择**: 从顺序 pipeline 改为候选收集 + 评分选择。先收集所有候选，再按分数排序选择最高分。

**理由**: 顺序 pipeline（当前方案）返回第一个有效结果即停止，可能错过更高质量的 icon。例如 apple-touch-icon 180x180 可能比 goscraper 选出的 32x32 好，但因为 goscraper 先执行，低质量图标被采用。

**替代方案**: 保持顺序 pipeline，只增加步骤 → 简单但无法保证选择最优。

### Decision 3: Manifest 解析方式

**选择**: 标准 Go HTTP 请求 + encoding/json 解析。不引入新依赖。

**理由**: Manifest 是标准 JSON 格式，解析逻辑简单，无需第三方库。

### Decision 4: 批量任务并发模型

**选择**: `sync.WaitGroup` + buffered channel worker pool，4 并发，同 host 限速。

**理由**: 简单可靠，控制并发数避免对目标站造成压力。同 host mutex 防止对同一域名并发请求。

**替代方案**: 使用 goroutine 池库（如 ants）→ 引入新依赖，不值得。

### Decision 5: /api/img 补缓存

**选择**: 在 `GetLogoImgHandler` 中，缓存未命中时调用 `FetchAndCacheImage(url)` 尝试下载并缓存。

**理由**: 用户清空 nav_img 后，只要 nav_table.logo 仍有 URL，前端请求 /api/img 时自动恢复缓存。最小改动最大效果。

**替代方案**: 返回 404 让用户手动刷新 → 体验差。

### Decision 6: 数据库扩展策略

**选择**: 不改 nav_img 表结构，在 service 层内部缓存检测结果。对 nav_table 加 icon_status/icon_error/icon_updated_at 列（可批量重试的基础）。

**理由**: nav_img 是图片缓存表，加元数据收益不大（前端不直接使用）。nav_table 的 icon 状态字段对批量管理有价值（查询缺失/失败的 icon）。通过 ALTER TABLE 添加带 DEFAULT 的新列，不影响旧数据。

### Decision 7: Google Fallback 尺寸

**选择**: sz=256。已验证 Google API 支持此尺寸。

**理由**: 256x256 是桌面端高清晰度的合理尺寸，Google API 支持最大到 256。

## 外部依赖

- `goscraper` — 已有，用于 HTML 抓取
- Go 标准库 `encoding/json` — 用于 manifest 解析
- Go 标准库 `image/png`, `image/jpeg` — 已有，用于尺寸检测
- 无需新增第三方依赖
