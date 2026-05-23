# Feature Specification: Icon 系统增强 — 高清获取与批量管理

**Feature Branch**: `003-icon-system`

**Created**: 2026-05-23

**Status**: Draft

**Input**: 增强网站 icon 自动获取流程（支持 manifest、SVG、ICO 多尺寸解析、候选评分），并新增批量重新获取、缓存管理、任务状态追踪机制。

## 问题分析

### 当前状态

项目已有 icon 获取链路：`service/image.go` → `goscraper` → Google favicon fallback → `nav_img` 缓存。

### 现有问题

1. 对 Web App Manifest 高清 icon 支持不明确
2. 对 `.ico` 多尺寸图标的最大尺寸选择不可靠
3. `nav_img` 只存 base64，缺少 content-type、width、height、source、fetched_at 等元数据
4. Google favicon fallback 尺寸偏保守（当前 sz=128）
5. 图标质量评分机制不明确
6. SVG icon 未优先使用
7. 更新 logo 时可能反复下载同一个 URL
8. 缺少失败降级策略
9. 无法批量重新获取 icon
10. 清空缓存后无法自动恢复
11. 获取失败无状态记录，用户不知道失败原因

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 自动获取高清 icon (Priority: P1)

用户只输入网站地址（不填 logo），系统自动获取高清、清晰、稳定的图标。目标优先级：SVG > Manifest 512/192 > Apple Touch Icon > 高清 PNG > ICO 最大尺寸 > Google fallback > 首字母 fallback。

**Why this priority**: Icon 获取是导航站的基础体验，低清或缺失 icon 直接影响用户感知。

**Independent Test**: 新增工具不填 logo，输入 https://github.com，等待异步获取后刷新，图标清晰显示。

**Acceptance Scenarios**:

1. **Given** 新增工具且 logo 为空，**When** 用户输入 https://github.com 后保存，**Then** 系统异步获取 GitHub 的 SVG/高清 icon 并显示。
2. **Given** 网站有 Web App Manifest，**When** 系统获取 icon，**Then** 优先使用 manifest 中 512x512 的 icon。
3. **Given** 网站只有 .ico 文件，**When** 系统获取 icon，**Then** 解析 ICO directory 选择最大尺寸。
4. **Given** 网站无可用的 favicon/manifest，**When** 系统获取 icon，**Then** 使用 Google favicon API sz=256 作为 fallback。
5. **Given** 所有获取方式均失败，**When** 前端显示该工具，**Then** 显示首字母 fallback，不显示破图。

---

### User Story 2 - 批量重新获取 icon (Priority: P1)

用户可以在后台批量操作 icon：重新获取缺失 icon、强制重新获取所有 icon、清空缓存后重抓。后台显示任务进度和失败原因。

**Why this priority**: 用户清空缓存或批量导入后需要快速恢复所有 icon，目前只能逐个手动处理。

**Independent Test**: 清空所有 icon 缓存，点击"重新获取缺失 icon"按钮，等待任务完成后刷新，大部分 icon 恢复。

**Acceptance Scenarios**:

1. **Given** 用户清空 nav_img 缓存但 nav_table.logo 保留，**When** 前端请求 /api/img?url=...，**Then** 后端自动下载并缓存该 URL 的图片，返回给前端。
2. **Given** 用户清空 nav_table.logo，**When** 点击"重新获取缺失 icon"，**Then** 系统对所有 logo 为空的工具执行 icon discovery。
3. **Given** 用户点击"强制重新获取全部 icon"，**When** 确认后，**Then** 系统清空所有 logo 和缓存，重新对全部工具执行 icon discovery。
4. **Given** 批量任务正在运行，**When** 用户查看状态，**Then** 看到总数、成功数、失败数和当前进度。
5. **Given** 部分网站获取失败，**When** 任务完成后，**Then** 失败项显示失败原因，其他项不受影响。

---

### User Story 3 - Icon 获取可靠性 (Priority: P2)

Icon 获取流程应该可靠、可重试、有限速。单个网站失败不影响整体批量任务。

**Why this priority**: 可靠性影响用户对系统的信任感，但获取成功率受外部因素限制。

**Independent Test**: 对 8 个网站（包含 example.invalid）执行批量获取，成功项正常显示，失败项显示 fallback 和失败原因。

**Acceptance Scenarios**:

1. **Given** 批量获取任务运行中，**When** 某个网站超时，**Then** 该网站标记为失败，任务继续处理其他网站。
2. **Given** 同一个域名，**When** 短时间内多次请求，**Then** 系统限制并发，同 host 至少间隔 500ms。
3. **Given** 单个工具的 icon 获取，**When** 超过 20 秒，**Then** 强制超时并标记失败。

## Requirements *(mandatory)*

### Functional Requirements

#### Icon 获取 Pipeline

- **FR-001**: URL 规范化：无 scheme 时补 `https://`，失败时再尝试 `http://`，统一 User-Agent 和超时（5-10 秒），限制最大下载体积。
- **FR-002**: 品牌预设：保留现有 `MatchBrandPreset`，预设独立为 `service/icon_presets.go`，使用稳定 SVG 或官方高分辨率资源。
- **FR-003**: HTML 解析：解析 link[rel=icon/shortcut icon/apple-touch-icon/manifest]、og:image、twitter:image 等标签，所有相对路径转绝对路径。
- **FR-004**: Manifest 解析：请求并解析 Web App Manifest，按 512>384>256>192>180>SVG>128 优先级选择 icon。
- **FR-005**: 路径探测：在 origin 下探测 /favicon.svg、/favicon.ico、/favicon-{size}.png 等常见路径，先 HEAD 再 GET 小范围读取。
- **FR-006**: 图片质量检查：支持 PNG/JPEG/ICO/WebP/SVG，最低 64x64，推荐 128x128+，理想 192x192+。
- **FR-007**: 候选评分：SVG +100、manifest +90、apple-touch-icon +80、rel=icon +70、probe +60、google +30、og:image +10；尺寸加分：512 +50、256 +40、192 +35、128 +25、64 +10、<64 -50。
- **FR-008**: Google fallback 改为 sz=256，检查响应是否为图片、文件是否过小。
- **FR-009**: SVG 优先：SVG URL 或 content-type 为 image/svg+xml 时高优先级，后端安全处理。

#### 批量管理与缓存

- **FR-010**: `/api/img` 查不到缓存时自动下载 URL 并缓存（方案 1），而非直接 404。
- **FR-011**: 新增 API：`POST /api/admin/tool/:id/icon/refresh` 单个工具刷新 icon。
- **FR-012**: 新增 API：`POST /api/admin/icons/refresh-missing` 批量刷新缺失 icon。
- **FR-013**: 新增 API：`POST /api/admin/icons/refresh-all` 批量强制刷新所有 icon。
- **FR-014**: 新增 API：`DELETE /api/admin/icons/cache` 清空 icon 缓存（cache-only / logo-only / cache-and-logo）。
- **FR-015**: 新增 API：`GET /api/admin/icons/status` 获取批量任务状态。
- **FR-016**: Worker pool 并发控制（4 goroutine），同 host 限速 500ms，单工具超时 20 秒。
- **FR-017**: 跳过文件夹、url 为空、特殊 url=admin 的工具。

#### 数据库扩展

- **FR-018**: nav_img 表新增 content_type、width、height、source、fetched_at 列（可选，可先在 service 层内部保留）。
- **FR-019**: nav_table 表新增 icon_status、icon_error、icon_updated_at 列（可选，可先在内存中记录）。

#### 前端

- **FR-020**: 后台管理页增加 icon 管理按钮（刷新缺失、强制刷新全部、清空缓存、清空并刷新）。
- **FR-021**: 任务进行中显示进度信息。
- **FR-022**: icon 加载中显示首字母 fallback（低透明度），不显示破图。
- **FR-023**: icon 重新获取成功后 invalidate React Query content cache。

### Key Entities

- **IconCandidate**: 候选 icon 结构，包含 URL、Rel、Type、Sizes、Score 等字段。
- **IconJob**: 批量获取任务，记录 total/done/success/failed 状态。

## Success Criteria *(mandatory)*

- **SC-001**: 新增工具不填 logo 时，能自动获取清晰 icon（github、bilibili、notion、apple、microsoft、tailwindcss、vite.dev 均可获取）。
- **SC-002**: 清空 nav_img 后刷新首页，/api/img 自动重新缓存，icon 逐步恢复。
- **SC-003**: 清空 nav_table.logo 后批量刷新缺失 icon，完成后大部分恢复。
- **SC-004**: 批量任务不会因单个网站失败而中断。
- **SC-005**: 没有 icon 时显示首字母 fallback，不显示破图。

## Assumptions

- Icon 获取不能承诺 100% 成功，因为网站本身可能没有可用 icon 或网络受限。
- Google favicon API 不是 100% 命中，仅作为最后 fallback。
- SVG 需要安全处理，前端已有 `sanitizeSvg`，后端也应避免缓存危险内容。
- 代理配置通过环境变量支持。

## Architecture Analysis

### 推荐新增文件

- `service/icon_presets.go` — 品牌预设独立文件
- `service/icon_discovery.go` — icon discovery pipeline（URL 规范化、HTML 解析、manifest 解析、路径探测、候选评分）
- `service/icon_job.go` — 批量任务管理（worker pool、状态追踪）
- `service/icon_cache.go` — 缓存层（FetchAndCacheImage、缓存 key 管理）

### API 端点

- `POST /api/admin/tool/:id/icon/refresh` — 单个刷新
- `POST /api/admin/icons/refresh-missing` — 批量刷新缺失
- `POST /api/admin/icons/refresh-all` — 批量强制刷新全部
- `DELETE /api/admin/icons/cache` — 清空缓存
- `GET /api/admin/icons/status` — 任务状态

### 修改顺序建议

1. 整理 icon discovery pipeline（URL 规范化 → 品牌预设 → HTML 解析 → manifest → 路径探测 → 评分 → fallback）
2. 修复 /api/img 自动补缓存
3. 新增批量管理 API
4. 前端管理界面
5. 数据库扩展（可选）
