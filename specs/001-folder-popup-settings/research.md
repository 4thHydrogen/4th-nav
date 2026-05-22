# Research: 文件夹组件完善

**Branch**: `001-folder-popup-settings` | **Date**: 2026-05-22

## R1: 全局列表行高存储位置

**Decision**: 在现有 `nav_site_config` 表中新增 `folder_list_item_size` 字段（整数，默认 28px，范围 20-60px）。

**Rationale**: `nav_site_config` 已经存储全局 UI 配置（compactMode, noImageMode, columnsPerRow, density），列表行高属于同一类"全局 UI 偏好"。复用现有 SiteConfig 结构和服务函数，无需创建新表。

**Alternatives considered**:
- 新建 `nav_folder_settings` 表 — 过度设计，单用户场景不需要独立表
- 放入 `nav_setting` 表 — 该表存站点元信息（favicon, title 等），不适合 UI 偏好
- 继续存在 `nav_table` 的 `folder_item_size` 列 — 这是当前方案，不符合"全局统一"需求

## R2: 弹出面板定位算法

**Decision**: 使用 `position: fixed` + 鼠标坐标偏移 + 视口边界碰撞检测。

**Rationale**:
- `position: fixed` 基于视口定位，不受父元素 overflow/transform 影响
- 计算逻辑：先尝试在鼠标点击位置右下方展开，若右边溢出则左对齐，若底部溢出则向上展开
- 最大高度 = `Math.min(面板内容高度, 视口高度 * 0.7)`
- 面板宽度固定或自适应内容（取决于 viewMode）

**Alternatives considered**:
- `position: absolute` + offset parent — 受 WidgetGrid 的 transform（dnd-kit 使用）影响，定位不准
- 第三方定位库（Floating UI / Popper.js） — 功能过重，4 个方向的简单碰撞检测足够
- CSS `anchor()` — 浏览器兼容性不够

## R3: 弹出面板与现有 InlineFolderPanel 的关系

**Decision**: 创建全新的 `FolderPopupPanel` 组件替代 `InlineFolderPanel`。

**Rationale**:
- InlineFolderPanel 是 inline 展开（在 grid 中占据空间），新需求是 floating popup（不占空间）
- 两者的渲染内容（工具列表、grid/list 切换）有重叠，但定位逻辑完全不同
- 新组件复用 ListToolItem 和 FolderItem 的渲染逻辑
- InlineFolderPanel 删除，避免代码混淆

**Alternatives considered**:
- 重构 InlineFolderPanel — 改动量大且保留 inline 逻辑无意义
- 共存两套面板 — 增加维护负担

## R4: 视图模式切换按钮位置

**Decision**: 在 FolderPopupPanel 顶部工具栏放置一个图标切换按钮（grid/list toggle）。

**Rationale**: 澄清阶段已确认，取代原 FolderSettingsPopup。简洁的图标按钮（如 grid icon / list icon）直接切换，无需额外弹窗。

## R5: 测试数据注入方式

**Decision**: 在后端 `init.db.go` 的 `initDefaultData` 函数中添加测试文件夹和条目的种子数据。

**Rationale**:
- 后端已有初始化默认数据的模式（默认用户、默认设置、默认搜索引擎）
- 利用现有 `ImportTools` service 函数批量插入
- 仅在 nav_table 为空时插入（不覆盖已有数据）
- 种子数据包含 3 个文件夹 + 各含 2-3 个网页条目

**Alternatives considered**:
- 前端 mock 数据 — 不经过后端，无法验证完整数据流
- 独立 seed 命令 — 单用户场景下无必要，启动时自动检测即可

## R6: 空文件夹自动删除触发时机

**Decision**: 在后端 `DeleteTool` 操作后检查其所属文件夹是否为空，若为空则级联删除文件夹。

**Rationale**:
- 后端已有 `MoveToolToFolder` 和 `DeleteTool` 函数
- 在 `DeleteTool` 中追加检查：查询被删条目的 parentId，若该 folder 下无其他条目则删除 folder
- 前端 React Query 缓存自动更新（refetch 或乐观更新）

**Alternatives considered**:
- 前端检测并调用删除 — 可靠性差，刷新后空文件夹仍存在
- 定时任务清理 — 单用户场景无需后台任务
