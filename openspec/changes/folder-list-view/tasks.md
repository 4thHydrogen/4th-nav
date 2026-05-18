## 1. 后端数据模型与 API

- [ ] 1.1 Go `types/types.go` Tool 结构体新增 `FolderViewMode string` 和 `FolderItemSize int` 字段（JSON tag: `folderViewMode`, `folderItemSize`）
- [ ] 1.2 Go `database/` 迁移：`nav_table` 新增 `folder_view_mode TEXT DEFAULT 'grid'` 和 `folder_item_size INTEGER DEFAULT 28`
- [ ] 1.3 Go `handler/handlers.go` + `service/`：创建和更新文件夹时接受 `folderViewMode` 和 `folderItemSize` 参数，返回时带上这两个字段
- [ ] 1.4 验证：用 curl 或前端调用 API 确认新建/编辑文件夹时新字段正确存储和返回

## 2. 前端类型与 API 层

- [ ] 2.1 `ui/src/types/index.ts` Tool interface 新增 `folderViewMode: "grid" | "list"` 和 `folderItemSize: number`
- [ ] 2.2 `ui/src/utils/api.tsx` 更新文件夹创建/编辑 API 调用，传递新字段
- [ ] 2.3 `ui/src/queries/index.ts` 确保 React Query 的乐观更新正确处理新字段

## 3. 覆盖式展开面板

- [ ] 3.1 重构 `InlineFolderPanel`：改为 `position: absolute` 覆盖层，不再使用 `grid-column: 1 / -1`，宽度改为 `fit-content` + `min-width`/`max-width` 约束
- [ ] 3.2 `WidgetGrid` 中实现面板定位逻辑：根据文件夹 DOM 的 `getBoundingClientRect()` 计算面板 top/left，处理视口边界溢出（下方不足时向上弹出）
- [ ] 3.3 `DesktopCategorySection` 中同样应用覆盖式定位
- [ ] 3.4 验证：展开面板不推挤周围元素，点击外部/Esc 关闭正常

## 4. 列表视图渲染

- [ ] 4.1 `WidgetFolder` 折叠态：当 `folderViewMode === "list"` 时，渲染列表预览（小 icon + 名称），根据文件夹高度和 itemSize 计算可显示条目数，溢出显示 "..."
- [ ] 4.2 `FolderItem` 折叠态：同上，列表预览渲染
- [ ] 4.3 `InlineFolderPanel` 展开态：当 `folderViewMode === "list"` 时，渲染完整列表（小 icon + 完整名称，一行一条，可滚动）
- [ ] 4.4 列表项组件：抽取 `ListToolItem` 组件，展示小 icon + 名称，行高由 itemSize 控制
- [ ] 4.5 验证：列表模式下折叠态和展开态渲染正确，条目数量和 "..." 显示正确

## 5. 设置浮窗

- [ ] 5.1 新建 `FolderSettingsPopup` 组件：包含视图模式切换（图标/列表）和条目大小滑块（20~48px 连续滑块）
- [ ] 5.2 在 `InlineFolderPanel` 头部添加 ⚙ 设置按钮，点击弹出 `FolderSettingsPopup`
- [ ] 5.3 设置变更即时生效：onChange 时调用 API 更新后端 + 更新本地 React Query 缓存
- [ ] 5.4 滑块仅在列表模式下显示/启用
- [ ] 5.5 验证：切换视图模式、拖动滑块时面板内容实时更新，刷新页面后设置保留

## 6. CSS 与样式

- [ ] 6.1 覆盖面板样式：z-index、圆角、阴影、毛玻璃背景
- [ ] 6.2 列表项样式：小 icon 尺寸、名称截断、行高响应 itemSize
- [ ] 6.3 设置浮窗样式：浮层定位、滑块样式、视图模式切换样式
- [ ] 6.4 折叠态列表预览 "..." 样式

## 7. 集成验证

- [ ] 7.1 端到端验证：创建文件夹 → 添加子项 → 展开 → 切换列表模式 → 调整条目大小 → 折叠 → 刷新页面确认持久化
- [ ] 7.2 图标模式回归：确认 grid 模式下所有行为与修改前完全一致
- [ ] 7.3 边界情况：空文件夹列表模式表现、1x1 小文件夹列表模式表现、大量子项（10+）列表滚动
