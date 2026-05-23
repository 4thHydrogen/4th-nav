# Tasks: 毛玻璃主题与 Pexels 壁纸

**Input**: Design documents from `specs/004-glassmorphism-wallpaper/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks grouped by user story. 粗粒度，每个任务覆盖一个完整的交付单元。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational — Glass CSS 变量系统

**Purpose**: 定义统一的 glass design tokens，为所有组件视觉一致性打基础。

- [ ] T001 定义 glass CSS 变量：在全局 CSS 中新增 `:root` 和 `body.dark-mode` 的 --glass-bg、--glass-bg-strong、--glass-border、--glass-shadow、--glass-blur、--glass-text、--glass-text-muted、--glass-hover 变量（见 data-model.md 中的具体值） — `ui/src/styles/globals.css`
- [ ] T002 [P] 创建 .glass-panel 通用类 + 降级规则：glass-panel 类（bg + border + shadow + backdrop-filter），`@supports not (backdrop-filter)` 降级为 bg-strong，`@media (max-width: 768px)` blur 降到 12px — `ui/src/styles/globals.css`

**Checkpoint**: 全局 CSS 文件包含完整的 glass 变量系统和降级规则。`pnpm build` 通过。

---

## Phase 2: US1 — 主题感知壁纸 (P1) 🎯 MVP

**Goal**: Pexels API 使用 color 参数实现真正的主题感知，缓存包含归因信息。

**Independent Test**: 配置 Pexels API Key，backgroundUrl=pexels，切换 dark/light 主题，壁纸色调跟随变化。

- [ ] T003 [US1] 增强 Pexels API 调用：修改 fetchPexelsImage，使用 Pexels API `color` 参数替代 query 加 "dark"。dark 主题 color=black + query="abstract glass dark gradient"，light 主题 color=white + query="minimal bright glass gradient"。支持用户自定义 hex 颜色。使用 photo.src.large2x 而非 original — `ui/src/utils/pexels.ts`
- [ ] T004 [US1] 增强缓存：缓存 key 改为 `pexels-v3:${theme}:${query}:${color}:landscape:large`，缓存内容扩展为 CachedPexelsImage 接口（url、photographer、photographerUrl、photoUrl、avgColor、alt、fetchedAt） — `ui/src/utils/pexels.ts`
- [ ] T005 [US1] Background 组件增加预加载和淡入：预加载 Image 对象，onload 后设为背景并 320ms opacity 淡入，loading 期间保持渐变 fallback，切换主题时旧壁纸保持到新壁纸就绪 — `ui/src/components/Background/index.tsx`, `ui/src/components/Background/index.css`
- [ ] T006 [US1] 背景层滤镜：light 主题 brightness(1.02) saturate(1.02)，dark 主题 brightness(0.72) saturate(1.08)，叠加 radial-gradient overlay 增加深度 — `ui/src/components/Background/index.css`

**Checkpoint**: quickstart.md Phase A/B 可验证。dark/light 壁纸色调差异明显，切换不闪白。

---

## Phase 3: US2 — 壁纸加载体验 (P1)

**Goal**: 壁纸加载有平滑淡入，失败有渐变 fallback，手动刷新可换图。

**Independent Test**: 清除缓存后刷新页面，观察壁纸加载过程。设置页点击"换一张"能切换壁纸。

- [ ] T007 [US2] 新增 PexelsCredit 归因组件：右下角固定定位显示 "Photo by {photographer} on Pexels"，字号 11px，opacity 0.5，可配置隐藏但默认显示。从 pexels 缓存读取 photographer 信息，无缓存时不显示 — `ui/src/components/PexelsCredit/index.tsx`, `ui/src/components/PexelsCredit/index.css`
- [ ] T008 [US2] 集成归因组件到主页面：在 Content 组件或 App 根组件中渲染 PexelsCredit，传入当前壁纸缓存数据 — `ui/src/components/Content/index.tsx`
- [ ] T009 [US2] 设置页增加"换一张"按钮：在壁纸配置区域新增按钮，点击清除当前缓存 key + 递增 refreshKey 触发 Background 重新获取。更新 tooltip 文案说明 pexels 格式和 API Key 需求 — `ui/src/pages/admin/tabs/Setting.tsx`

**Checkpoint**: quickstart.md Phase C 可验证。右下角有 Pexels attribution，"换一张"能切换壁纸。

---

## Phase 4: US3 — 毛玻璃统一设计系统 (P1)

**Goal**: 所有组件使用 glass CSS 变量，dark/light 主题正确切换。

**Independent Test**: 开启毛玻璃主题，对比各组件（widget card、folder、search bar、context menu）的背景和边框——全部半透明+模糊。

- [X] T010 [P] [US3] WidgetTool 应用 glass 变量：将硬编码的 background/backdrop-filter 替换为 var(--glass-bg) / var(--glass-blur) 等，仅在 enableGlassmorphism 开启时通过条件 class 激活 — `ui/src/components/WidgetTool/index.css`
- [X] T011 [P] [US3] WidgetFolder 应用 glass 变量 — `ui/src/components/WidgetFolder/index.css`
- [X] T012 [P] [US3] SearchBar 应用 glass 变量 — `ui/src/components/SearchBar/index.css`
- [X] T013 [P] [US3] DockBar 应用 glass 变量 — `ui/src/components/DockBar/index.css`
- [X] T014 [P] [US3] FolderFloatingWindow 应用 glass 变量 — `ui/src/components/FolderFloatingWindow/index.css`
- [X] T015 [P] [US3] ToolContextMenu 应用 glass 变量 — `ui/src/components/ToolContextMenu/index.css`
- [X] T016 [US3] 毛玻璃条件控制：确认 enableGlassmorphism 开关通过 body class（如 body.glass-mode）控制 glass 变量是否生效。关闭时组件使用不透明背景 — `ui/src/styles/globals.css`

**Checkpoint**: quickstart.md Phase D 可验证。所有组件在 dark/light 下外观一致，关闭毛玻璃时恢复不透明背景。

---

## Phase 5: US4 — 设置页壁纸配置 (P2)

**Goal**: 壁纸配置入口明显可见，功能完整。

**Independent Test**: 打开设置页，能清晰找到壁纸配置区域，配置 Pexels 并预览。

- [ ] T017 [US4] 设置页壁纸配置区域改进：增加壁纸来源说明文案（"输入 pexels 使用自动主题壁纸；输入 pexels:nature 使用指定关键词"），Pexels API Key 旁边增加测试按钮（可选），色调选择说明 — `ui/src/pages/admin/tabs/Setting.tsx`

**Checkpoint**: quickstart.md Phase A 可验证。设置页壁纸功能明显可见。

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Foundational — CSS 变量) — 独立
Phase 2 (US1 — Pexels 增强) — 独立，可与 Phase 1 并行
Phase 3 (US2 — 加载体验) — 依赖 Phase 2
Phase 4 (US3 — 毛玻璃组件) — 依赖 Phase 1
Phase 5 (US4 — 设置页) — 依赖 Phase 2
```

### Within Each Phase

- Phase 1: T001 先执行（变量定义），T002 可并行
- Phase 2: T003-T004 可并行（同文件但不同函数），T005-T006 依赖 T003-T004
- Phase 3: T007-T009 可并行（不同文件）
- Phase 4: T010-T015 全部可并行（不同组件 CSS 文件），T016 最后执行
- Phase 5: T017 独立

### Parallel Opportunities

- Phase 1 和 Phase 2 完全并行
- Phase 4 的 7 个任务全部并行（7 个不同 CSS 文件）
- Phase 3 和 Phase 4 可部分并行（US3 的 CSS 不依赖 US2 的 Pexels 改动）

### MVP Scope

完成 Phase 1 + Phase 2 + Phase 4 即可交付 MVP（主题感知壁纸 + 毛玻璃组件）。Phase 3（归因+刷新）和 Phase 5（设置页改进）为增量交付。

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 4)

1. Phase 1: 定义 glass CSS 变量
2. Phase 2: 增强 Pexels 壁纸
3. Phase 4: 应用 glass 到所有组件
4. **STOP and VALIDATE**: 用 quickstart.md Phase A/D 验证

### Incremental Delivery

1. Phase 1+2+4 → MVP（主题壁纸 + 毛玻璃效果）
2. + Phase 3 → 完整体验（归因 + 手动刷新 + 加载优化）
3. + Phase 5 → 设置页完善

---

## Notes

- 无新增前端依赖
- Pexels API 是免费 REST API，需用户自行申请 API Key
- glass 变量通过 CSS 变量系统实现，不需要 JavaScript 运行时计算
- backdrop-filter 兼容性：Chrome 76+, Firefox 103+, Safari 9+
- Phase 4 的 7 个 CSS 任务可并行处理，是最容易并行化的阶段
