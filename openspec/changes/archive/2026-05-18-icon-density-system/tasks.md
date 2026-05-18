## 1. 后端：密度字段

- [x] 1.1 `database/init.db.go`: 新增 `density TEXT NOT NULL DEFAULT 'standard'` 列（保留旧 iconSize 列不删除）
- [x] 1.2 `types/types.go`: SiteConfig 结构体新增 `Density string` 字段，JSON tag `density`
- [x] 1.3 `service/site_config.go`: GetSiteConfig 读取 density 列（nil → "standard"），UpdateSiteConfig 写入 density
- [x] 1.4 `handler/handlers.go`: 确认 UpdateSiteConfigHandler 的 ShouldBindJSON 能正确绑定 density 字段

## 2. 前端：类型与 API

- [x] 2.1 `ui/src/types/index.ts`: SiteConfig 新增 `density?: string`，移除或标记废弃 `iconSize`
- [x] 2.2 `ui/src/pages/admin/tabs/Setting.tsx`: 图标大小下拉框改为密度选择（紧凑/标准/宽松），表单字段名改为 `density`

## 3. 前端：自适应计算引擎

- [x] 3.1 `ui/src/components/Content/index.tsx`: 替换原有 iconSize useEffect，改为根据 `density` 设置 `--icon-size`、`--icon-gap`、`--row-height` 到 `.desktop-page`
- [x] 3.2 `ui/src/components/Content/index.css`: 移除硬编码 `--icon-size: 44px` 和 `--row-height: 80px`，改为从 JS 设置的变量继承；移动端 media query 同步调整

## 4. 前端：网格系统适配

- [x] 4.1 `ui/src/components/WidgetGrid/useGridLayout.ts`: ROW_HEIGHT 和 MARGIN 改为从 CSS 变量读取（`getComputedStyle`），提供 density 切换后的响应式重排
- [x] 4.2 `ui/src/components/WidgetGrid/index.tsx`: `--cell-width`、`--row-height`、`--cell-gap-x`、`--cell-gap-y` 保持从 JS 计算设置，确保与 useGridLayout 读取的值一致

## 5. 前端：组件尺寸统一

- [x] 5.1 `ui/src/components/WidgetTool/index.css`: small 模式 fallback 统一为 48px；large 模式 icon 尺寸改为 `calc(var(--grid-w, 1) * var(--icon-size, 48px) + (var(--grid-w, 1) - 1) * var(--icon-gap, 6px))`
- [x] 5.2 `ui/src/components/WidgetFolder/index.css`: 背景尺寸公式改为通用公式 `calc(var(--grid-w, 1) * var(--icon-size, 48px) + (var(--grid-w, 1) - 1) * var(--icon-gap, 6px))`，移除 `--cell-width`/`--row-height` 混搭
- [x] 5.3 `ui/src/components/WidgetFolder/index.tsx`: 确认 `--grid-w`/`--grid-h` CSS 变量正确传递
- [x] 5.4 `ui/src/components/DockBar/index.css`: fallback 从 48px 统一为 `var(--icon-size, 48px)`
- [x] 5.5 `ui/src/components/ToolItem/index.css`: fallback 从 56px 统一为 `var(--icon-size, 48px)`

## 6. 验证

- [x] 6.1 启动前后端，确认管理后台密度下拉框正确保存和读取
- [x] 6.2 切换密度（紧凑/标准/宽松），确认所有组件 icon 大小同步变化
- [x] 6.3 确认 1×1 icon、M×N 文件夹在不同密度下尺寸正确、文字在下方
- [x] 6.4 确认 DockBar、搜索结果页 icon 大小跟随密度变化
- [x] 6.5 运行 `cd ui && pnpm test` 确认无回归
