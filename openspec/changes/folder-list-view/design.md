## Context

Van Nav 的文件夹功能当前有两种展开行为：
- **WidgetGrid**（绝对定位网格）：InlineFolderPanel 通过绝对定位占据 `grid-column: 1 / -1` 全宽行，推挤下方内容增加 totalHeight
- **DesktopCategorySection**（流式布局）：InlineFolderPanel 作为 FolderItem 的兄弟 DOM 节点插入

两种场景下展开面板都与文件夹本身分离，视觉上呈现为独立区域。

文件夹子项在折叠态和展开态均以图标网格形式展示，无法查看完整名称。

## Goals / Non-Goals

**Goals:**
- 文件夹展开面板以覆盖层形式弹出，不推挤周围元素，宽度自适应内容
- 文件夹支持列表视图模式（小 icon + 名称，一行一条）
- 列表模式条目大小可通过连续滑块调节（20~48px），实时预览
- 设置存入后端数据库，跨设备持久化
- 图标模式行为完全不变

**Non-Goals:**
- 不修改图标模式（grid）的任何现有行为
- 不改变文件夹的拖拽、右键菜单等交互
- 不支持嵌套文件夹（子文件夹内再套文件夹）
- 不做全局统一的视图模式切换（保持每个文件夹独立设置）

## Decisions

### 1. 覆盖面板定位策略：绝对定位 + offset 计算

**选择**：面板使用 `position: absolute`（WidgetGrid 内已有 relative 容器），通过 JS 计算文件夹 DOM 节点的 `getBoundingClientRect()` 来定位面板的 top/left。

**替代方案**：
- `position: fixed`：需要额外处理滚动偏移，且在滚动容器内定位不准确
- CSS Popover API：浏览器兼容性不确定

**理由**：与现有 WidgetGrid 绝对定位架构一致，最小改动。

### 2. 面板宽度：内容自适应 + 最小/最大约束

**选择**：面板宽度 `fit-content`，`min-width` 为文件夹宽度，`max-width` 不超过容器宽度。

**理由**：列表模式下每行宽度由最长项目名称决定，图标模式下由列数决定。自适应宽度最自然。

### 3. 数据存储：Tool 表新增两个字段

**选择**：在 `nav_table` 新增 `folder_view_mode TEXT DEFAULT 'grid'` 和 `folder_item_size INTEGER DEFAULT 28`。

**替代方案**：
- 单独的 folder_settings 表：过度设计，一对一直接加列即可
- JSON 字段存储所有配置：查询不便，且目前只有两个配置项

**理由**：简单直接，Go 端只需扩展 Tool 结构体和 SQL。

### 4. 设置浮窗：内联组件，非模态

**选择**：设置浮窗作为展开面板的子组件渲染，非模态对话框。修改通过 `onChange` 直接触发 API 更新 + 本地状态更新实现即时预览。

**替代方案**：
- 模态对话框：太重，打断用户操作流
- Drawer/抽屉：不适合这么小的配置项

**理由**：设置项只有两个（视图模式 + 滑块），浮窗最轻量。

### 5. DesktopCategorySection 的处理

**选择**：同样应用覆盖式展开和列表模式。由于 DesktopCategorySection 是流式布局，覆盖面板使用 `position: absolute` + 相对父容器的定位。

**理由**：保持两套布局下的行为一致。

## Risks / Trade-offs

- **[面板溢出屏幕]** → 需要计算面板位置，确保不超出视口边界。如果下方空间不足，面板向上弹出
- **[列表模式折叠态溢出计算]** → 需要根据文件夹实际像素高度和 itemSize 动态计算可显示条目数，涉及 CSS 布局后的测量
- **[向后兼容]** → 新字段有默认值，旧数据升级后自动为 grid 模式 + 28px，无需数据迁移脚本
- **[设置浮窗 z-index]** → 需要确保浮窗在面板之上，不被其他元素遮挡
