## Why

当前导航站的图标系统存在三个核心问题：图标来源分散（5 种来源互不关联）、模糊 favicon 被当作主要图标使用、品牌图标缺少系统化管理。用户添加工具时经常看到模糊的小图标，或者不同功能的 UI 图标风格不统一（Ant Design 实心图标和 Radix 线性图标混用）。

## What Changes

- 引入 Lucide 作为统一的 UI 图标库，替换 @ant-design/icons 和 @radix-ui/react-icons
- goscraper 抓取 favicon 时增加分辨率过滤：低于 64px 的图标弃用，优先使用 SVG favicon
- 首字母 fallback 增加基于名称 hash 的柔和背景色，提升无图标时的视觉体验
- 扩充 icon-presets 域名匹配预设，从 45 个扩展到 200+，覆盖主流国际/国内品牌和自部署服务
- 已知品牌域名永不抓取 favicon，始终使用预设的高质量 SVG
- IconPicker 增加搜索功能，支持跨来源搜索（品牌、分类、内置）
- 所有品牌图标统一为 SVG 格式，替换现有的 PNG 文件
- 静态图标文件统一命名规范

## Capabilities

### New Capabilities
- `icon-quality-filter`: 图标质量过滤 — favicon 抓取时的分辨率检查和质量筛选策略
- `icon-fallback-visual`: 首字母 fallback 视觉增强 — 基于名称的自动配色方案
- `icon-presets-expansion`: 品牌图标预设扩充 — 扩展域名匹配覆盖范围和品牌图标集
- `iconpicker-search`: IconPicker 搜索增强 — 跨来源搜索和分类浏览改进

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- **前端依赖变化**：新增 lucide-react，移除 @ant-design/icons 和 @radix-ui/react-icons
- **goscraper 改动**：图标抓取逻辑增加尺寸检测
- **静态资源**：ui/public/static/icons/brand/ 中 PNG 文件替换为 SVG
- **涉及组件**：ToolItem、IconPicker、FloatingActions、WidgetFolder、CategoryFilter、管理后台各页面
- **向后兼容**：已有的 tool.logo 数据不受影响，渐进式升级
