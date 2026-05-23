# Research: 毛玻璃主题与 Pexels 壁纸

**Feature**: 004-glassmorphism-wallpaper
**Date**: 2026-05-23

## 现有代码分析

### 当前 Pexels 集成

| 文件 | 职责 | 现状 |
|------|------|------|
| `ui/src/utils/pexels.ts` | Pexels API 调用 + 缓存 | 基础功能有，主题感知弱 |
| `ui/src/components/Background/index.tsx` | 背景渲染 | 支持 Pexels/Bing/URL 三模式 |
| `ui/src/pages/admin/tabs/Setting.tsx` | 设置页 | 有 API Key 输入、开关 |
| `service/settings.go` | 后端设置 | 所有字段已入库 |

### 现有能力

- Pexels URL 解析（`pexels` / `pexels:关键词` 格式）
- 暗色主题在 query 前加 `dark`（非 Pexels API `color` 参数）
- localStorage 缓存 24h
- 支持背景开关、毛玻璃开关
- MutationObserver 监听 body class 变化触发重获取

### 缺失能力

1. **无 Pexels `color` 参数使用**：暗色主题只是给 query 加 "dark"，没用 API 的 color 参数
2. **无归因显示**：Pexels 要求 attribution，当前无任何显示
3. **无手动刷新按钮**：settings 页没有"换一张"入口
4. **无加载/fallback 状态**：加载失败无渐变 fallback
5. **缓存 key 不含主题参数**：切换主题不会获取新壁纸
6. **毛玻璃无 CSS 变量**：没有统一的 glass design tokens
7. **无性能降级**：不支持 backdrop-filter 的浏览器无 fallback
8. **缓存内容不完整**：不存 photographer/photoUrl 等归因信息
9. **设置文案不明显**：用户以为没有壁纸功能

## 技术决策

### Decision 1: 缓存 key 策略

**选择**: `pexels-v3:${theme}:${query}:${color}:${orientation}:${size}`

**理由**: 切换主题时 theme 变化 → 新 key → 自动获取匹配壁纸。包含 color 确保不同色调不共享缓存。

**替代方案**: 简单 key（只含 query）→ 切换主题显示同一张图，不匹配。

### Decision 2: 壁纸来源选择 UI

**选择**: 在现有设置输入框基础上改进 tooltip 和提示文案。最低成本方案。

**理由**: 文档明确说"如果不想大改 UI，至少保留现有输入框，但更新 tooltip"。下拉选择（关闭/URL/Bing/Pexels）涉及更多 UI 改动，可作为后续优化。

**替代方案**: 新增下拉选择器 → UI 改动大，非必须。

### Decision 3: 毛玻璃 CSS 变量位置

**选择**: 在 `ui/src/styles/` 全局 CSS 文件中定义 `:root` 和 `body.dark-mode` 的 glass 变量。

**理由**: 所有组件共享同一套变量，dark/light 切换只需改 body class。一处定义处处生效。

### Decision 4: Pexels 响应使用 large2x

**选择**: 使用 `photo.src.large2x`（非 original）。

**理由**: original 可能 10MB+，背景图不需要。large2x 约 1-2MB，桌面端足够清晰。

### Decision 5: attribution 组件

**选择**: 右下角固定定位的轻量文字 "Photo by {name} on Pexels"，11px，opacity 0.5，可配置隐藏。

**理由**: Pexels 要求 attribution，但不应影响视觉。轻量文字是最佳平衡。

## 外部依赖

- 无新增依赖
- Pexels API 是免费 REST API，已有 API Key 配置
- backdrop-filter 浏览器兼容性：Chrome 76+, Firefox 103+, Safari 9+（需 -webkit- 前缀）
