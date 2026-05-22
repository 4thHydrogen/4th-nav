---
title: 文件夹 API 约定
type: reference
permalink: 4th-nav/api/文件夹-api-约定
---

# 文件夹 API 约定

## 移入文件夹
- Mutation: `useMoveToFolder()` in `ui/src/queries/index.ts`
- 调用: `moveToFolder.mutate({ toolId, folderId })`
- `folderId` 为 `number` 时移入指定文件夹

## 移出文件夹（到根级别）
- 同一个 mutation: `moveToFolder.mutate({ toolId, folderId: null })`
- 传 `null` 将条目从文件夹移出到主面板
- 底层 API: `PUT /api/admin/tool/:toolId/parent` body `{ parentId: null }`

## 合并创建文件夹
- Mutation: `useMergeToFolder()` in `ui/src/queries/index.ts`
- 自动创建新文件夹并将两个条目移入
- 调用: `mergeToFolder.mutate({ toolId1, toolId2, catelog })`

## 空文件夹自动删除
- 后端 `DeleteToolHandler` 在删除条目后检查父文件夹是否为空
- 空文件夹会被自动级联删除
- 逻辑在 `handler/handlers.go` 的 `DeleteToolHandler` 中

- relation: [[dnd-kit-portal-limitation]]