# Data Model: 文件夹组件完善

**Branch**: `001-folder-popup-settings` | **Date**: 2026-05-22

## Entity Changes

### 1. SiteConfig (modified)

现有实体，新增一个字段：

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| folderListItemSize | int | 28 | 全局列表行高（px），范围 20-60 |

**Go struct change** (`types/types.go`):
```go
type SiteConfig struct {
    // ... existing fields ...
    FolderListItemSize int `json:"folderListItemSize"`
}
```

**TypeScript interface change** (`ui/src/types/index.ts`):
```typescript
export interface SiteConfig {
  // ... existing fields ...
  folderListItemSize: number;
}
```

**Database migration** (`database/init.db.go`):
```sql
ALTER TABLE nav_site_config ADD COLUMN folder_list_item_size INTEGER NOT NULL DEFAULT 28;
```

### 2. Tool (modified, field deprecated)

`folderItemSize` 字段保留在数据库中（避免破坏性迁移），但前端不再读取该字段。所有列表行高统一从 `SiteConfig.folderListItemSize` 获取。

| Field | Status | Note |
|-------|--------|------|
| folderItemSize | Deprecated | 不再使用，前端改用全局设置 |
| folderViewMode | Active | 每个文件夹独立保留（grid/list 切换） |

### 3. FolderPopupPanel (new frontend entity)

纯前端组件，无后端存储。

| Property | Type | Description |
|----------|------|-------------|
| folder | Tool | 目标文件夹对象 |
| children | Tool[] | 文件夹内条目列表 |
| mouseX | number | 鼠标点击 X 坐标（视口） |
| mouseY | number | 鼠标点击 Y 坐标（视口） |
| listItemSize | number | 全局列表行高（from SiteConfig） |
| onClose | () => void | 关闭回调 |
| onOpenTool | (tool) => void | 打开工具回调 |

### 4. Test Seed Data (new)

**后端 `init.db.go` 新增种子数据（仅在 nav_table 为空时插入）：**

| Folder | Items |
|--------|-------|
| 常用工具 (type=folder) | GitHub, Google, Stack Overflow |
| 学习资源 (type=folder) | MDN, TypeScript Docs, React Docs |
| 社交媒体 (type=folder) | Twitter/X, Reddit, YouTube |
| 独立条目 (type=icon) | Gmail, Notion |

所有测试条目使用真实 URL 和 favicon。

## State Transitions

### FolderPopupPanel lifecycle:
```
closed → (user clicks folder) → open (positioned at mouse)
open → (click outside / Esc) → closed
open → (click another folder) → closed → open (new position)
open → (click item) → navigate + remain open
```

### Empty folder auto-deletion:
```
tool in folder → (delete last tool) → check folder item count → count == 0 → delete folder
```

## Validation Rules

- `folderListItemSize`: integer, range [20, 60], default 28
- `folderViewMode`: enum ["grid", "list"], default "grid"
- Popup panel max height: min(contentHeight, viewportHeight * 0.7)
- Popup panel must not exceed viewport bounds on any side
