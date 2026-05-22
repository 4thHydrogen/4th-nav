# Quickstart: 文件夹组件完善

**Branch**: `001-folder-popup-settings` | **Date**: 2026-05-22

## Prerequisites

- Go 1.25+
- Node.js 18+
- 现有项目可正常编译和运行

## Implementation Order

按依赖关系排列，每个步骤应独立可验证：

### Step 1: 后端 — 全局列表行高字段
1. `types/types.go`: SiteConfig 新增 `FolderListItemSize` 字段
2. `database/init.db.go`: 添加 `folder_list_item_size` 列迁移
3. `service/site_config.go`: GetSiteConfig / UpdateSiteConfig 处理新字段
4. `types/dto.go`: 如果 UpdateSiteConfig DTO 需要更新则更新
5. **验证**: 启动后端，调用 GET/PUT siteConfig API 确认新字段存在

### Step 2: 后端 — 测试数据种子
1. `database/init.db.go`: 在 `initDefaultData` 中添加测试文件夹和条目
2. **验证**: 删除 data/ 目录下数据库，重启后端，确认 API 返回测试数据

### Step 3: 后端 — 空文件夹自动删除
1. `service/tools.go`: 在 DeleteTool 中追加空文件夹检测和删除逻辑
2. **验证**: 通过 API 删除文件夹内最后一个条目，确认文件夹也被删除

### Step 4: 前端 — 全局行高设置
1. `ui/src/types/index.ts`: SiteConfig 新增 `folderListItemSize`
2. `ui/src/queries/index.ts`: 确认 siteConfig 查询包含新字段
3. `ui/src/components/WidgetFolder/index.tsx`: 用 `siteConfig.folderListItemSize` 替代 `folder.folderItemSize`
4. `ui/src/components/ListToolItem/index.tsx`: 接收全局行高 prop
5. 全局设置面板中添加列表行高滑块控件
6. **验证**: 修改设置面板滑块，确认所有列表模式文件夹行高同步变化

### Step 5: 前端 — FolderPopupPanel 组件
1. 新建 `ui/src/components/FolderPopupPanel/index.tsx`
2. 实现鼠标位置定位 + 视口边界检测算法
3. 内部渲染 grid/list 两种模式的工具列表
4. 顶部放置 view mode 切换按钮
5. 点击外部或 Esc 关闭
6. **验证**: 点击文件夹，弹窗出现在鼠标位置；靠近边界时自动贴紧

### Step 6: 前端 — 集成和清理
1. `WidgetGrid` 中替换 InlineFolderPanel 为 FolderPopupPanel
2. 传递鼠标坐标给 FolderPopupPanel
3. 删除 `FolderSettingsPopup` 组件
4. 删除或弃用 `InlineFolderPanel` 组件
5. 清理 `useUpdateFolderSettings` query 中的行高相关逻辑（保留 viewMode 切换）
6. **验证**: 完整流程测试 — 点击文件夹、切换模式、点击条目导航、关闭弹窗

## Key Files to Modify

| File | Change Type |
|------|------------|
| `types/types.go` | Modify (add field) |
| `types/dto.go` | Modify (update DTO if needed) |
| `database/init.db.go` | Modify (migration + seed data) |
| `service/site_config.go` | Modify (handle new field) |
| `service/tools.go` | Modify (empty folder deletion) |
| `handler/handlers.go` | Modify (if new endpoints needed) |
| `ui/src/types/index.ts` | Modify (add field) |
| `ui/src/queries/index.ts` | Modify (update hooks) |
| `ui/src/stores/ui.ts` | Modify (popup state) |
| `ui/src/components/FolderPopupPanel/` | NEW |
| `ui/src/components/WidgetGrid/index.tsx` | Modify (integrate popup) |
| `ui/src/components/WidgetFolder/index.tsx` | Modify (use global size) |
| `ui/src/components/ListToolItem/index.tsx` | Modify (accept global size) |
| `ui/src/components/FolderSettingsPopup/` | DELETE |
| `ui/src/components/InlineFolderPanel/` | DELETE or DEPRECATE |
