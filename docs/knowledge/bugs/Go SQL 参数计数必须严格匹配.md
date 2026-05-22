---
title: Go SQL 参数计数必须严格匹配
type: reference
permalink: 4th-nav/bugs/go-sql-参数计数必须严格匹配
---

# Go SQL 参数计数必须严格匹配

**规则**: Go 中 `database.DB.Prepare(sql)` + `stmt.Exec(params...)` 模式，SQL 的 `?` 占位符数量必须与 `Exec()` 参数数量完全一致。

**案例**: `service/tools.go` 的 `UpdateTool` 曾从 SQL SET 移除 `folder_view_mode` 和 `folder_item_size` 但未清理 `Exec()` 参数，导致 15 占位符 vs 17 参数。WHERE `id=?` 拿到 `normalizeFolderViewMode(...)` 而非 `data.Id`，右键修改文件夹大小完全无效。

**How to apply**: 每次修改 Go SQL SET 子句时，立即数 `?` 数量和 `Exec()` 参数数量。

- relation: [[folder-api-conventions]]