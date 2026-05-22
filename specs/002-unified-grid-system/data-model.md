# Data Model: 统一网格系统

**Date**: 2026-05-22
**Feature**: specs/002-unified-grid-system

## 现有实体（无需修改 schema）

### Tool (nav_table)

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER PK | 自增主键 |
| name | TEXT | 名称 |
| url | TEXT | 网址 |
| logo | TEXT | 图标 URL 或内联 SVG |
| catelog | TEXT | 分类 |
| desc | TEXT | 描述 |
| sort | INTEGER | 排序权重 |
| hide | BOOLEAN | 是否隐藏 |
| view_mode | TEXT | "icon" 或 "card" |
| type | TEXT | "icon" 或 "folder" |
| parent_id | INTEGER NULL | 父文件夹 ID（NULL = 主面板） |
| size | TEXT | "1x1", "2x2" 等网格尺寸 |
| bg_color | TEXT | 背景色 |
| grid_x | INTEGER | 网格 X 坐标（-1 = 自动布局） |
| grid_y | INTEGER | 网格 Y 坐标（-1 = 自动布局） |
| folder_view_mode | TEXT | "grid" 或 "list"（仅文件夹） |
| folder_item_size | TEXT | 文件夹内条目尺寸（仅文件夹） |

### 状态转换

```
[主面板条目] --MoveToFolder--> [文件夹内条目]
[文件夹内条目] --MoveOut--> [主面板条目]
[两个条目] --Alt+Drag--> [新建文件夹 + 两个条目移入]
[文件夹内最后条目移出] --> [文件夹自动删除]
```

## 新增前端状态

### FloatingWindowState（Zustand store 或组件 state）

| Field | Type | Description |
|-------|------|-------------|
| folderId | number \| null | 当前打开的文件夹 ID |
| position | { x: number, y: number } | 浮动窗口位置 |
| isOpen | boolean | 是否打开 |

### 验证规则

- `folderId` 为 NULL 时 `isOpen` 必为 false
- `position` 必须在视口边界内
- 同一时间只能有一个浮动窗口打开
