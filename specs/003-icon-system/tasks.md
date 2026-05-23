# Tasks: Icon 系统增强 — 高清获取与批量管理

**Input**: Design documents from `specs/003-icon-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks grouped by user story. 粗粒度，每个任务覆盖一个完整的交付单元。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational — 新增文件与类型定义

**Purpose**: 创建新文件骨架和共享类型，为后续 pipeline 和 API 打基础。

- [X] T001 新增 `service/icon_discovery.go`：定义 IconCandidate 结构体和候选评分函数 ScoreCandidates — `service/icon_discovery.go`
- [X] T002 [P] 新增 `service/icon_cache.go`：定义 FetchAndCacheImage 函数（下载图片、校验 content-type/尺寸、写入 nav_img、返回二进制和 content-type） — `service/icon_cache.go`
- [X] T003 [P] 新增 `service/icon_job.go`：定义 IconJobStatus 结构体、全局任务状态变量、WorkerPool 函数骨架（sync.WaitGroup + buffered channel + 4 goroutine） — `service/icon_job.go`

**Checkpoint**: 三个新文件可编译，类型定义就绪。`go build ./...` 通过。

---

## Phase 2: US1 — 自动获取高清 icon (P1) 🎯 MVP

**Goal**: 替换现有 LazyFetchLogo 为候选收集+评分 pipeline，大多数网站能自动拿到清晰 icon。

**Independent Test**: 新增工具不填 logo，输入 https://github.com，等待异步获取后刷新，图标清晰显示。测试 6 个网站（github/bilibili/vite.dev/tailwindcss/apple/microsoft）。

- [X] T004 [US1] 实现 HTML 解析收集器：在 `service/icon_discovery.go` 中新增 collectFromHTML(rawURL) 函数，使用 goscraper 抓取页面，解析所有 link[rel=icon/shortcut icon/apple-touch-icon/manifest/mask-icon] 和 meta[og:image/twitter:image]，构建 []IconCandidate，所有相对路径转绝对路径 — `service/icon_discovery.go`
- [X] T005 [US1] 实现 Manifest 解析：新增 fetchManifestIcons(pageURL, manifestHref) 函数，请求 manifest JSON，解析 icons 数组，按 512>384>256>192>180>SVG>128 优先级排序，相对路径基于 manifest URL 转绝对 — `service/icon_discovery.go`
- [X] T006 [US1] 扩展路径探测：重写 probeCommonIconPaths(rawURL)，从 4 个路径扩展到 16 个（增加 /favicon.svg、/favicon-512x512.png、/favicon-256x256.png 等），先 HEAD 不行再 GET 小范围读取，校验 status code 和 content-type — `service/icon_discovery.go`
- [X] T007 [US1] 实现 ICO 最大尺寸选择：新增 parseIcoMaxSize(data []byte) (int, int) 函数，解析 ICO directory header，遍历 entries 返回最大宽高 — `service/icon_discovery.go`
- [X] T008 [US1] 实现评分系统：完善 ScoreCandidates 函数，按 source（SVG +100, manifest +90, apple-touch +80, rel=icon +70, probe +60, google +30, og:image +10）和尺寸（512 +50, 256 +40, 192 +35, 128 +25, 64 +10, <64 -50）计算分数，同源 +10，返回最高分候选 — `service/icon_discovery.go`
- [X] T009 [US1] 重写 LazyFetchLogo：在 `service/image.go` 中改造 LazyFetchLogo 为调用新 pipeline（brand preset → 收集所有候选 → 评分 → 选最高分 → Google fallback → 首字母），保留 MatchBrandPreset 和 fetchGoogleFavicon 逻辑，fetchGoogleFavicon 改为 sz=256 — `service/image.go`
- [X] T010 [US1] 修改 GetLogoImgHandler 补缓存：缓存未命中时调用 FetchAndCacheImage(url)，成功返回图片，失败才 404 — `handler/public.go`, `service/icon_cache.go`

**Checkpoint**: 用 quickstart.md Phase A 步骤验证。6 个测试网站大部分能获取清晰 icon。

---

## Phase 3: US2 — 批量重新获取 icon (P1)

**Goal**: 新增 5 个管理 API，支持批量刷新缺失/全部、清空缓存、查看任务状态。

**Independent Test**: 清空所有 icon 缓存，点击"重新获取缺失 icon"，等待任务完成后刷新，大部分 icon 恢复。

- [X] T011 [US2] 实现批量任务执行逻辑：在 `service/icon_job.go` 中实现 RefreshMissingIcons() 和 RefreshAllIcons(force, clearCache bool)，遍历工具列表（跳过 folder/url 为空/url=admin），使用 worker pool 并发执行，同 host sync.Mutex 限速，单工具超时 20s — `service/icon_job.go`
- [X] T012 [US2] 实现缓存清理逻辑：新增 ClearIconCache(mode string) 函数，cache-only 删 nav_img 所有行，logo-only 清空 nav_table.logo，cache-and-logo 同时执行 — `service/icon_job.go`
- [X] T013 [US2] 新增单个工具刷新 handler：新增 IconRefreshHandler，解析 :id 参数，调用 RefreshSingleIcon(id, force) — `handler/tool.go`
- [X] T014 [US2] 新增批量管理 handlers：IconsRefreshMissingHandler、IconsRefreshAllHandler、IconsClearCacheHandler、IconsStatusHandler — `handler/tool.go`
- [X] T015 [US2] 注册新路由：在 `server/router.go` 中注册 5 个新 API 端点（POST /api/admin/tool/:id/icon/refresh、POST /api/admin/icons/refresh-missing、POST /api/admin/icons/refresh-all、DELETE /api/admin/icons/cache、GET /api/admin/icons/status），需 admin 认证 — `server/router.go`

**Checkpoint**: 用 curl 或 API 测试工具验证 5 个端点。批量任务能看到进度状态。

---

## Phase 4: US3 — Icon 获取可靠性 (P2)

**Goal**: nav_table 新增 icon 状态字段，获取流程更新状态，失败可重试。

**Independent Test**: 对包含 example.invalid 的 8 个网站执行批量获取，成功项正常，失败项有错误原因。

- [X] T016 [US3] 数据库迁移：在启动时执行 ALTER TABLE nav_table ADD COLUMN icon_status TEXT DEFAULT ''、icon_error TEXT DEFAULT ''、icon_updated_at INTEGER DEFAULT 0（IF NOT EXISTS 模式，兼容已有列） — `database/` 或 `main.go`
- [X] T017 [US3] 更新 icon 获取流程写状态：在 discovery pipeline 中，开始获取前设 icon_status='fetching'，成功设 'success'，失败设 'failed' 并写 icon_error，跳过设 'skipped' — `service/icon_discovery.go`
- [X] T018 [US3] 批量任务利用 icon_status：RefreshMissingIcons 只处理 icon_status 为空或 'failed' 且 logo 为空的工具 — `service/icon_job.go`

**Checkpoint**: 批量任务后查看 nav_table，每条记录有 icon_status。失败项有 icon_error 文本。

---

## Phase 5: US2 前端 — 管理界面 (P1)

**Goal**: 设置页增加 icon 管理按钮和任务状态显示。

**Independent Test**: 设置页看到 icon 管理区域，点击按钮触发对应 API，任务进行中看到进度。

- [X] T019 [US2] 新增 icon 管理 API 调用函数：在 `ui/src/shared/api.ts` 中新增 refreshMissingIcons()、refreshAllIcons()、clearIconCache()、getIconJobStatus() — `ui/src/shared/api.ts`
- [X] T020 [US2] 设置页增加 icon 管理区域：在系统设置 tab 底部增加"图标管理"区域，包含 4 个按钮（重新获取缺失图标、强制重新获取全部、清空图标缓存、清空并重新获取），危险操作有二次确认弹窗 — `ui/src/pages/admin/tabs/Setting.tsx`
- [X] T021 [US2] 任务状态显示：点击刷新按钮后轮询 GET /api/admin/icons/status，显示进度（总数/成功/失败），完成后自动停止轮询并 invalidate content query 刷新页面图标 — `ui/src/pages/admin/tabs/Setting.tsx`

**Checkpoint**: 设置页 icon 管理功能完整可用。quickstart.md Phase C/D 可验证。

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Foundational — 类型定义)
    ↓
Phase 2 (US1 — Discovery Pipeline) ← 依赖 Phase 1 的类型
    ↓
Phase 3 (US2 — 批量 API) ← 依赖 Phase 2 的 pipeline
    ↓
Phase 4 (US3 — 可靠性) ← 依赖 Phase 3 的批量逻辑
    ↓
Phase 5 (US2 前端) ← 依赖 Phase 3 的 API 端点
```

### Within Each Phase

- Phase 1: T001, T002, T003 可并行（不同文件）
- Phase 2: T004-T008 可并行（不同函数），T009 依赖 T004-T008，T010 独立
- Phase 3: T011-T012 可并行，T013-T014 依赖 T011，T015 依赖 T013-T014
- Phase 4: T016 先执行，T017-T018 可并行
- Phase 5: T019 先执行，T020-T021 依赖 T019

### MVP Scope

完成 Phase 1 + Phase 2 即可交付 MVP（高清 icon 自动获取 + /api/img 补缓存）。Phase 3-5 为增量交付。

---

## Implementation Strategy

### MVP First (Phase 1-2)

1. Phase 1: 创建新文件和类型
2. Phase 2: 重写 icon pipeline + 补缓存
3. **STOP and VALIDATE**: 用 quickstart.md Phase A/B 验证

### Incremental Delivery

1. Phase 1-2 → MVP（高清 icon + 缓存恢复）
2. + Phase 3-5 → 完整批量管理 + 前端界面

---

## Notes

- 品牌预设文件 `service/brand-presets.go` 不修改
- 无新增第三方 Go 依赖
- 前端只需修改设置页，不影响主页面组件
- icon 获取成功率受外部因素限制，不能承诺 100%
