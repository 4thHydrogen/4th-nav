# Implementation Plan: Icon 系统增强 — 高清获取与批量管理

**Branch**: `master` | **Date**: 2026-05-23 | **Spec**: [spec.md](spec.md)

## Summary

增强网站 icon 自动获取流程，从顺序 pipeline 改为候选收集+评分选择机制，新增 manifest 解析、HTML 全面解析、扩展路径探测。新增批量管理 API（刷新缺失/全部、清空缓存、任务状态），/api/img 自动补缓存。前端增加 icon 管理入口。

## Technical Context

**Language/Version**: Go 1.26 + TypeScript (React 18)

**Primary Dependencies**: goscraper（已有）, Go 标准库 encoding/json/image

**Storage**: SQLite — nav_table（新增 icon_status/icon_error/icon_updated_at 列）, nav_img（不改表结构）

**Testing**: go test, pnpm build

**Target Platform**: Web（Go 后端 + React 前端）

**Constraints**: 单次获取超时 5s，单工具最大 20s，批量并发 4，同 host 限速 500ms

## Project Structure

### Documentation

```text
specs/003-icon-system/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code

```text
service/
├── brand-presets.go       # 已有，品牌预设（不修改）
├── image.go               # 已有，保留原有函数逐步迁移
├── icon_discovery.go      # 新增 — discovery pipeline（候选收集+评分）
├── icon_job.go            # 新增 — 批量任务管理（worker pool、状态）
├── icon_cache.go          # 新增 — 缓存层（FetchAndCacheImage、补缓存）
└── tools.go               # 已有，修改 AddTool/ImportTools（已修复 SQL）

handler/
├── tool.go                # 修改 — 新增 icon refresh handler
└── public.go              # 修改 — GetLogoImgHandler 补缓存逻辑

server/
└── router.go              # 修改 — 注册新 API 路由

ui/src/
├── shared/api.ts          # 修改 — 新增 icon 管理 API 调用
├── pages/admin/tabs/      # 修改 — 设置页增加 icon 管理区域
└── queries/               # 修改 — 新增 icon 任务状态 query
```

## Implementation Phases

### Phase 1: Discovery Pipeline 重构

**Goal**: 替换 LazyFetchLogo 为新的候选收集+评分 pipeline。

**Files**:
- 新增 `service/icon_discovery.go` — IconCandidate 类型、收集逻辑、评分
- 修改 `service/image.go` — LazyFetchLogo 改为调用新 pipeline
- 修改 `handler/tool.go` — AddTool/UpdateTool 触发新 pipeline

**Key Changes**:
1. `IconCandidate` 结构体（URL/Rel/Sizes/Score/Source）
2. 收集器：HTML 解析所有 link[rel] + og:image + twitter:image
3. Manifest 解析：请求 /manifest.json，解析 icons 数组
4. 扩展路径探测：从 4 个增加到 16 个路径，支持 SVG/512/256 等
5. ICO directory 解析：选择最大尺寸的 entry
6. 评分规则：SVG +100, manifest +90, apple-touch +80, rel=icon +70, probe +60, google +30, og:image +10
7. 尺寸加分：512 +50, 256 +40, 192 +35, 128 +25, 64 +10, <64 -50
8. Google fallback 改为 sz=256

### Phase 2: /api/img 自动补缓存

**Goal**: 缓存未命中时自动下载并缓存，而非直接 404。

**Files**:
- 新增 `service/icon_cache.go` — FetchAndCacheImage 函数
- 修改 `handler/public.go` — GetLogoImgHandler 补缓存逻辑

**Key Changes**:
1. `FetchAndCacheImage(rawURL)` — 下载图片、校验 content-type/尺寸、写入 nav_img
2. `GetLogoImgHandler` — 缓存未命中时调用 FetchAndCacheImage，成功返回图片，失败才 404

### Phase 3: 批量管理 API

**Goal**: 新增 5 个 API 端点用于批量 icon 管理。

**Files**:
- 新增 `service/icon_job.go` — IconJobStatus、worker pool、任务执行
- 修改 `handler/tool.go` — 新增 5 个 handler
- 修改 `server/router.go` — 注册新路由

**Key Changes**:
1. 单个刷新：POST /api/admin/tool/:id/icon/refresh
2. 批量缺失：POST /api/admin/icons/refresh-missing
3. 批量全部：POST /api/admin/icons/refresh-all
4. 清空缓存：DELETE /api/admin/icons/cache
5. 任务状态：GET /api/admin/icons/status
6. Worker pool：4 goroutine，sync.WaitGroup，buffered channel
7. 同 host 限速：map[string]*sync.Mutex
8. 超时控制：单请求 5s，单工具 20s

### Phase 4: 数据库迁移 + icon 状态

**Goal**: nav_table 新增 icon_status/icon_error/icon_updated_at 字段。

**Files**:
- 修改 `database/` 或 `main.go` — ALTER TABLE 语句
- 修改 `service/icon_discovery.go` — 更新 icon_status
- 修改 `service/icon_job.go` — 读取/更新 icon 状态

### Phase 5: 前端管理界面

**Goal**: 设置页增加 icon 管理按钮和状态显示。

**Files**:
- 修改 `ui/src/shared/api.ts` — 新增 API 调用函数
- 修改 `ui/src/pages/admin/tabs/Setting.tsx` — 增加 icon 管理区域
- 新增 `ui/src/queries/useIconJobStatus.ts` — 任务状态轮询

**Key Changes**:
1. 设置页增加"图标管理"区域
2. 四个按钮：刷新缺失、强制刷新全部、清空缓存、清空并刷新
3. 二次确认弹窗用于危险操作
4. 任务进行中显示进度（轮询 /api/admin/icons/status）
5. icon 加载中/失败时显示首字母 fallback

## Dependency Order

```
Phase 1 (Discovery Pipeline) — 独立
Phase 2 (/api/img 补缓存) — 独立，可与 Phase 1 并行
Phase 3 (批量 API) — 依赖 Phase 1
Phase 4 (DB 迁移) — 依赖 Phase 3
Phase 5 (前端) — 依赖 Phase 3
```

Phase 1 和 Phase 2 可并行执行。Phase 3-5 必须按顺序。
