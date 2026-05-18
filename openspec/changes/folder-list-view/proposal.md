## Why

文件夹展开后以独立面板（InlineFolderPanel）占据整行空间，视觉割裂且推开其他元素。用户希望文件夹能原地覆盖展开，并支持列表视图模式以获得更丰富的信息展示（图标+名称一行一条）。

## What Changes

- **覆盖式展开**：文件夹点击后，展开面板以覆盖层形式从文件夹位置弹出（自适应宽度，不推挤周围元素），替代当前全宽 InlineFolderPanel
- **列表视图模式**：每个文件夹可独立选择「图标网格」或「列表」视图模式
  - 列表模式下，每个子项显示为「小 icon + 完整名称」，一行一条
  - 折叠态：根据文件夹尺寸和条目大小，尽可能多地展示列表项，放不下的用 "..." 表示
  - 展开态：显示完整列表
- **条目大小可配置**：通过连续滑块控制列表模式下每行的行高，范围约 20~48px
- **文件夹内设置浮窗**：展开面板中增加 ⚙ 按钮，点击弹出设置浮窗，可切换视图模式和调整条目大小，修改即时生效
- **后端持久化**：新增字段 `folder_view_mode`（"grid" | "list"）和 `folder_item_size`（整数 px 值），存入数据库

## Capabilities

### New Capabilities
- `folder-list-view`: 文件夹列表视图模式，包括折叠态列表预览、展开态列表渲染、条目大小滑块配置
- `folder-overlay-expand`: 文件夹覆盖式展开面板，自适应宽度，从文件夹位置弹出，不推挤周围元素
- `folder-settings-popup`: 文件夹设置浮窗组件，支持视图模式切换和条目大小滑块，修改即时生效

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **Go 后端**: `types/types.go` Tool 结构体新增 `FolderViewMode` 和 `FolderItemSize` 字段；`database/` 新增迁移列；`handler/` 和 `service/` 更新创建/编辑文件夹逻辑
- **React 前端**: `types/index.ts` 同步新增字段；`WidgetFolder` 组件增加列表预览渲染；`InlineFolderPanel` 重构为覆盖式定位 + 列表模式；新增 `FolderSettingsPopup` 组件；`WidgetGrid` 调整面板定位逻辑
- **API**: 文件夹创建/更新接口接受新字段，返回时带上新字段
- **数据库**: `nav_table` 新增 `folder_view_mode TEXT DEFAULT 'grid'` 和 `folder_item_size INTEGER DEFAULT 28`
