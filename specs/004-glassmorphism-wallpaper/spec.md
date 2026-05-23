# Feature Specification: 毛玻璃主题与 Pexels 壁纸

**Feature Branch**: `004-glassmorphism-wallpaper`

**Created**: 2026-05-23

**Status**: Draft

**Input**: 以毛玻璃为视觉主题方向，完善 Pexels 壁纸功能（主题感知、归因、加载体验），统一 glass CSS 变量，应用到所有组件。

## 问题分析

### 当前状态

项目已有 Pexels 壁纸相关代码（`ui/src/components/Background/index.tsx`、`ui/src/utils/pexels.ts`、设置页），支持 `pexels` / `pexels:关键词` 格式和 localStorage 24h 缓存。

### 现有问题

1. 设置文案和交互不明显，用户以为没有壁纸功能
2. 暗色主题只是给 query 前面加 `dark`，没有使用 Pexels API 的 `color` 参数
3. 没有根据主题色/accent color 获取壁纸
4. 没有显示 Pexels 归属信息
5. 没有手动刷新/换一张的明显入口
6. 没有 loading/fallback 状态
7. 没有区分亮色/暗色壁纸的可读性处理
8. 毛玻璃主题缺少统一设计变量
9. backdrop-filter 在不支持时有降级策略

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 主题感知壁纸 (Priority: P1)

配置 Pexels API Key 后，系统根据当前主题（dark/light）自动获取匹配的壁纸。暗色主题获取深色壁纸，亮色主题获取浅色壁纸。

**Why this priority**: 壁纸是毛玻璃主题的核心——没有背景图，毛玻璃效果没有意义。

**Independent Test**: 配置 Pexels API Key，backgroundUrl 设为 `pexels`，开启背景和毛玻璃。切换 dark/light 主题，壁纸色调跟随变化。

**Acceptance Scenarios**:

1. **Given** 暗色主题 + Pexels 已配置，**When** 系统请求壁纸，**Then** 使用 `color=black` 或 `color=gray` 参数，query 为用户关键词或 "abstract glass dark gradient"。
2. **Given** 亮色主题 + Pexels 已配置，**When** 系统请求壁纸，**Then** 使用 `color=white` 或 `color=gray` 参数，query 为用户关键词或 "minimal bright glass gradient"。
3. **Given** 用户设置了主题色（如蓝色），**When** 系统请求壁纸，**Then** 使用 `color=#3b82f6` 参数。
4. **Given** Pexels 壁纸加载完成，**When** 用户查看页面右下角，**Then** 看到 "Photo by xxx on Pexels" 归属信息。

---

### User Story 2 - 壁纸加载体验 (Priority: P1)

壁纸加载时有平滑的淡入效果，加载失败有渐变 fallback，切换主题时不闪白。

**Why this priority**: 加载体验直接影响第一印象，闪白或破图会破坏整体质感。

**Independent Test**: 清除缓存后刷新页面，观察壁纸加载过程：先渐变背景 → 壁纸淡入。

**Acceptance Scenarios**:

1. **Given** 壁纸尚未加载，**When** 页面渲染，**Then** 显示渐变背景作为 fallback。
2. **Given** 壁纸预加载完成，**When** 渲染到 DOM，**Then** 以 320ms 淡入。
3. **Given** 壁纸加载失败，**When** 超时或错误，**Then** 保持渐变背景，不显示破图。
4. **Given** 用户点击"换一张"，**When** 新壁纸加载中，**Then** 旧壁纸保持显示直到新壁纸就绪。

---

### User Story 3 - 毛玻璃统一设计系统 (Priority: P1)

所有组件（widget card、folder、dock、search box、floating window、context menu）使用统一的 glass CSS 变量，dark/light 主题各有一套值。

**Why this priority**: 毛玻璃是整体视觉方向，不统一会显得拼凑。

**Independent Test**: 开启毛玻璃主题后，对比 widget card、folder、search bar、context menu 的背景和边框——全部使用半透明+模糊效果。

**Acceptance Scenarios**:

1. **Given** 毛玻璃已开启，**When** 用户查看任意 widget card，**Then** 背景为半透明 + backdrop-filter blur + 轻边框 + 柔和阴影。
2. **Given** 切换到暗色主题，**When** 用户查看组件，**Then** glass 变量自动切换为暗色系（低亮度、半透明深色）。
3. **Given** 浏览器不支持 backdrop-filter，**When** 渲染组件，**Then** 使用更强的不透明背景作为降级。
4. **Given** 移动端浏览器，**When** 渲染毛玻璃，**Then** blur 强度降低到 12px（性能优化）。

---

### User Story 4 - 设置页壁纸配置 (Priority: P2)

设置页中壁纸功能明显可见，支持选择来源、配置关键词、预览和手动刷新。

**Why this priority**: 配置入口的可见性影响用户发现和使用。

**Independent Test**: 打开设置页，找到壁纸配置区域，配置 Pexels 并预览。

**Acceptance Scenarios**:

1. **Given** 设置页打开，**When** 用户查看壁纸配置区域，**Then** 看到背景来源选择（关闭/URL/Bing/Pexels）、API Key 输入、关键词输入、色调选择。
2. **Given** Pexels 已配置，**When** 用户点击"换一张"，**Then** 立即请求新壁纸并淡入切换。
3. **Given** 用户修改关键词或色调，**When** 保存后，**Then** 缓存清除并获取新壁纸。

## Requirements *(mandatory)*

### Functional Requirements

#### Pexels API

- **FR-001**: 使用 `photo.src.large2x` 作为默认壁纸尺寸（非 original），original 仅在用户明确选择"原图模式"时使用。
- **FR-002**: 请求参数：orientation=landscape, size=large, color=主题感知, per_page=30, page=random 1-3。
- **FR-003**: 主题感知策略：dark → color=black/gray + query="abstract glass dark gradient"；light → color=white/gray + query="minimal bright glass gradient"；用户关键词优先。
- **FR-004**: 用户自定义主题色时，color 参数传 hex 值（如 `#3b82f6`）。

#### 缓存

- **FR-005**: 缓存 key 格式：`pexels-v3:${theme}:${query}:${color}:${orientation}:${size}`。
- **FR-006**: 缓存内容包含：url、photographer、photographerUrl、photoUrl、avgColor、alt、fetchedAt。
- **FR-007**: 缓存 24 小时，手动刷新只清理当前 key。

#### 背景加载

- **FR-008**: 预加载 Image 对象，加载成功后淡入（320ms ease）。
- **FR-009**: 加载失败 fallback 到渐变背景。
- **FR-010**: 切换主题时不清除旧壁纸，新壁纸就绪后再替换（不闪白）。

#### 归属

- **FR-011**: 右下角显示 "Photo by {photographer} on Pexels"，字号 11px，opacity 0.5，可配置隐藏但默认显示。

#### 毛玻璃 CSS 变量

- **FR-012**: 定义统一 CSS 变量（`:root` 和 `body.dark-mode`）：`--glass-bg`、`--glass-bg-strong`、`--glass-border`、`--glass-shadow`、`--glass-blur`、`--glass-text`、`--glass-text-muted`、`--glass-hover`。
- **FR-013**: `.glass-panel` 通用类：background + border + box-shadow + backdrop-filter。
- **FR-014**: 应用到：widget card、folder、dock、search box、floating window、settings button、context menu。
- **FR-015**: 性能降级：`@supports not (backdrop-filter: blur(1px))` 使用更强不透明背景；移动端 blur 降到 12px。

#### 设置页

- **FR-016**: 壁纸来源选择（关闭/URL/Bing/Pexels）。
- **FR-017**: Pexels API Key 输入、搜索关键词输入、色调选择（自动/暗色/亮色）。
- **FR-018**: 预览壁纸、换一张、清除缓存按钮。

### Key Entities

- **CachedPexelsImage**: 缓存结构（url、photographer、avgColor 等）。
- **GlassTheme**: CSS 变量集合（light/dark 两套）。

## Success Criteria *(mandatory)*

- **SC-001**: 配置 Pexels 后 backgroundUrl=pexels，dark 主题显示暗色壁纸，light 主题显示浅色壁纸。
- **SC-002**: 手动刷新能换图，失败时有 fallback，不闪白。
- **SC-003**: 页面右下角有 Pexels attribution。
- **SC-004**: 所有组件使用统一 glass 变量，dark/light 两套值正确切换。
- **SC-005**: 不支持 backdrop-filter 的浏览器有降级。

## Assumptions

- Pexels API Key 由用户自行申请和配置。
- 壁纸使用 large2x 而非 original 以控制带宽。
- 毛玻璃性能主要受 backdrop-filter 影响，移动端可降低 blur。
- 现有 `backgroundUrl` / `pexelsApiKey` / `enableBackground` / `enableGlassmorphism` 配置项可复用。
- 数据库字段扩展（wallpaperQuery、wallpaperTone、wallpaperColor）可选，优先用 `backgroundUrl` 编码方案减少迁移。
