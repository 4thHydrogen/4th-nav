# Data Model: 毛玻璃主题与 Pexels 壁纸

**Feature**: 004-glassmorphism-wallpaper
**Date**: 2026-05-23

## 新增前端类型

### CachedPexelsImage

```ts
interface CachedPexelsImage {
  url: string;              // photo.src.large2x
  photographer: string;     // photo.photographer
  photographerUrl: string;  // photo.photographer_url
  photoUrl: string;         // photo.url
  avgColor: string;         // photo.avg_color
  alt: string;              // photo.alt
  fetchedAt: number;        // Date.now()
}
```

## CSS 变量系统

### Light Theme (`:root`)

```css
--glass-bg: rgba(255, 255, 255, 0.58);
--glass-bg-strong: rgba(255, 255, 255, 0.72);
--glass-border: rgba(255, 255, 255, 0.45);
--glass-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
--glass-blur: 18px;
--glass-text: rgba(15, 23, 42, 0.92);
--glass-text-muted: rgba(15, 23, 42, 0.62);
--glass-hover: rgba(255, 255, 255, 0.76);
```

### Dark Theme (`body.dark-mode`)

```css
--glass-bg: rgba(15, 23, 42, 0.46);
--glass-bg-strong: rgba(15, 23, 42, 0.62);
--glass-border: rgba(255, 255, 255, 0.14);
--glass-shadow: 0 18px 48px rgba(0, 0, 0, 0.36);
--glass-blur: 20px;
--glass-text: rgba(248, 250, 252, 0.94);
--glass-text-muted: rgba(248, 250, 252, 0.66);
--glass-hover: rgba(30, 41, 59, 0.68);
```

### 通用类

```css
.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
}
```

### 降级

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel { background: var(--glass-bg-strong); }
}
@media (max-width: 768px) {
  :root { --glass-blur: 12px; }
}
```

## 应用范围

以下组件使用 `.glass-panel` 或对应 glass 变量：

- widget card (WidgetTool)
- folder (WidgetFolder)
- dock (DockBar)
- search box (SearchBar)
- floating window (FolderFloatingWindow)
- settings button (SettingsButton)
- context menu (ToolContextMenu)

## Pexels API 调用参数

| 参数 | Light 主题 | Dark 主题 | 自定义主题色 |
|------|-----------|-----------|-------------|
| query | 用户关键词 \|\| "minimal bright glass gradient" | 用户关键词 \|\| "abstract glass dark gradient" | 用户关键词 |
| color | "white" \|\| "gray" | "black" \|\| "gray" | hex 如 "#3b82f6" |
| orientation | landscape | landscape | landscape |
| size | large | large | large |
| per_page | 30 | 30 | 30 |
| page | random 1-3 | random 1-3 | random 1-3 |

## 缓存策略

- Key: `pexels-v3:${theme}:${query}:${color}:${orientation}:${size}`
- TTL: 24 小时
- 手动刷新: 只清除当前 key
- 存储内容: CachedPexelsImage 完整结构
