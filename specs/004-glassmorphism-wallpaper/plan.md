# Implementation Plan: 毛玻璃主题与 Pexels 壁纸

**Branch**: `master` | **Date**: 2026-05-23 | **Spec**: [spec.md](spec.md)

## Summary

增强 Pexels 壁纸功能（主题感知 color 参数、归因显示、手动刷新、缓存增强），统一定义 glass CSS 变量系统（light/dark 两套），应用到所有组件，添加不支持 backdrop-filter 的降级策略。

## Technical Context

**Language/Version**: TypeScript (React 18) + CSS

**Primary Dependencies**: 无新增依赖

**Storage**: localStorage（Pexels 缓存）、CSS 变量（glass tokens）

**Testing**: pnpm build, 手动浏览器测试

**Target Platform**: Web

**Constraints**: 壁纸加载 <3s（large2x），毛玻璃 blur 不影响滚动性能

## Project Structure

### Documentation

```text
specs/004-glassmorphism-wallpaper/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code

```text
ui/src/
├── styles/
│   └── globals.css           # 修改 — 新增 glass CSS 变量 + .glass-panel 类
├── utils/
│   └── pexels.ts             # 修改 — 增强 Pexels 调用（color 参数、缓存增强）
├── components/
│   ├── Background/
│   │   ├── index.tsx          # 修改 — 增加预加载、淡入、fallback
│   │   └── index.css          # 修改 — 增加滤镜、overlay 效果
│   ├── PexelsCredit/
│   │   ├── index.tsx          # 新增 — Pexels 归因组件
│   │   └── index.css          # 新增
│   ├── WidgetTool/
│   │   └── index.css          # 修改 — 应用 glass 变量
│   ├── WidgetFolder/
│   │   └── index.css          # 修改 — 应用 glass 变量
│   ├── SearchBar/
│   │   └── index.css          # 修改 — 应用 glass 变量
│   ├── DockBar/
│   │   └── index.css          # 修改 — 应用 glass 变量
│   ├── FolderFloatingWindow/
│   │   └── index.css          # 修改 — 应用 glass 变量
│   └── ToolContextMenu/
│       └── index.css          # 修改 — 应用 glass 变量
└── pages/admin/tabs/
    └── Setting.tsx            # 修改 — 增加"换一张"按钮、改进提示文案
```

## Implementation Phases

### Phase 1: Pexels 增强

**Goal**: 增强主题感知、缓存、归因、手动刷新。

**Files**:
- 修改 `ui/src/utils/pexels.ts` — color 参数、缓存 key 含主题、存 photographer 信息
- 修改 `ui/src/components/Background/index.tsx` — 预加载、淡入、fallback
- 修改 `ui/src/components/Background/index.css` — 滤镜、overlay
- 新增 `ui/src/components/PexelsCredit/` — 归因显示组件

**Key Changes**:
1. Pexels API 调用使用 `color` 参数替代 query 加 "dark"
2. 缓存 key 改为 `pexels-v3:${theme}:${query}:${color}:...`
3. 缓存内容扩展为 CachedPexelsImage（含 photographer、avgColor 等）
4. Background 组件增加 Image 预加载 + 320ms 淡入
5. 加载失败保持渐变背景 fallback
6. 右下角 PexelsCredit 显示 attribution

### Phase 2: Glass CSS 变量系统

**Goal**: 定义统一 glass 变量，创建 .glass-panel 通用类。

**Files**:
- 修改 `ui/src/styles/globals.css` — 新增 `:root` 和 `body.dark-mode` glass 变量 + `.glass-panel` + 降级规则

**Key Changes**:
1. `:root` 定义 light glass 变量
2. `body.dark-mode` 覆盖为 dark glass 变量
3. `.glass-panel` 通用类（bg + border + shadow + backdrop-filter）
4. `@supports not` 降级
5. `@media (max-width: 768px)` 降低 blur

### Phase 3: 应用 glass 到所有组件

**Goal**: 所有组件改用 glass 变量替代硬编码半透明值。

**Files**:
- 修改 WidgetTool/index.css
- 修改 WidgetFolder/index.css
- 修改 SearchBar/index.css
- 修改 DockBar/index.css
- 修改 FolderFloatingWindow/index.css
- 修改 SettingsButton/index.css
- 修改 ToolContextMenu/index.css

**Key Changes**:
1. 将现有 `background: rgba(...)` / `backdrop-filter: blur(...)` 替换为 `var(--glass-*)` 变量
2. 确保毛玻璃只在 `enableGlassmorphism` 开启时生效（可能需要条件 class）

### Phase 4: 设置页增强

**Goal**: 添加"换一张"按钮、改进提示文案。

**Files**:
- 修改 `ui/src/pages/admin/tabs/Setting.tsx`

**Key Changes**:
1. 添加"换一张"按钮（清除当前缓存 key → 触发 Background 重新获取）
2. 更新 tooltip：明确说明 pexels 格式和 API Key 需求
3. 可选：壁纸来源下拉选择（关闭/URL/Bing/Pexels）

## Dependency Order

```
Phase 1 (Pexels 增强) — 独立
Phase 2 (Glass CSS 变量) — 独立，可与 Phase 1 并行
Phase 3 (应用 glass) — 依赖 Phase 2
Phase 4 (设置页) — 依赖 Phase 1
```

Phase 1 和 Phase 2 可并行。Phase 3 和 Phase 4 可并行（各自依赖不同前置）。
