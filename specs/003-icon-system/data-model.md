# Data Model: Icon 系统增强

**Feature**: 003-icon-system
**Date**: 2026-05-23

## 新增数据库字段

### nav_table 扩展

```sql
ALTER TABLE nav_table ADD COLUMN icon_status TEXT DEFAULT '';
ALTER TABLE nav_table ADD COLUMN icon_error TEXT DEFAULT '';
ALTER TABLE nav_table ADD COLUMN icon_updated_at INTEGER DEFAULT 0;
```

| 字段 | 类型 | 说明 |
|------|------|------|
| icon_status | TEXT | 空/pending/fetching/success/failed/skipped |
| icon_error | TEXT | 失败原因（如 "timeout fetching https://example.com"） |
| icon_updated_at | INTEGER | Unix 时间戳，最后获取时间 |

## 新增 Go 类型

### IconCandidate

```go
type IconCandidate struct {
    URL    string
    Rel    string   // icon, apple-touch-icon, manifest, og:image 等
    Type   string   // image/png, image/svg+xml 等
    Sizes  string   // "192x192", "any" 等
    Width  int
    Height int
    Source string   // html, manifest, probe, google, preset
    IsSVG  bool
    Score  int
}
```

### IconJobStatus

```go
type IconJobStatus struct {
    Running   bool
    Total     int
    Done      int
    Success   int
    Failed    int
    LastError string
}
```

### ManifestIcon（内部使用）

```go
type WebAppManifest struct {
    Icons []ManifestIcon `json:"icons"`
}

type ManifestIcon struct {
    Src   string `json:"src"`
    Sizes string `json:"sizes"`
    Type  string `json:"type"`
}
```

## 新增 API 端点

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | /api/admin/tool/:id/icon/refresh | 单个刷新 | `{"force": bool}` |
| POST | /api/admin/icons/refresh-missing | 刷新缺失 | — |
| POST | /api/admin/icons/refresh-all | 强制刷新全部 | `{"clearCache": bool, "force": bool}` |
| DELETE | /api/admin/icons/cache | 清空缓存 | `{"mode": "cache-only"/"logo-only"/"cache-and-logo"}` |
| GET | /api/admin/icons/status | 任务状态 | — |

## 状态流转

```
(空) → pending → fetching → success
                             ↘ failed → (手动重试) → fetching → ...
             ↘ skipped (folder/url为空/url=admin)
```

## 批量任务过滤规则

跳过以下工具的 icon 获取：
- `type = "folder"`
- `url = ""` 或 `url IS NULL`
- `url = "admin"` (特殊内部工具)
