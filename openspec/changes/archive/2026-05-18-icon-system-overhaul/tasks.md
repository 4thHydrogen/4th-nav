## 1. Lucide UI 图标统一

- [x] 1.1 安装 lucide-react，从 package.json 移除 @ant-design/icons 和 @radix-ui/react-icons
- [x] 1.2 替换管理后台中 @ant-design/icons 的所有引用为 Lucide 等效图标
- [x] 1.3 替换管理后台中 @radix-ui/react-icons 的所有引用为 Lucide 等效图标
- [x] 1.4 替换 FloatingActions 中的手写 SVG（github/sun/moon/refresh）为 Lucide 组件
- [x] 1.5 替换 WidgetFolder 中的手写 SVG（folder）为 Lucide 组件
- [x] 1.6 替换 CategoryFilter 中的手写 SVG（settings）为 Lucide 组件
- [ ] 1.7 验证管理后台和首页所有 UI 图标显示正常

## 2. favicon 质量过滤

- [x] 2.1 在 goscraper 中实现 favicon 尺寸解析函数（支持 PNG 尺寸头和 ICO 目录解析）
- [x] 2.2 goscraper 抓取 favicon 后调用尺寸检查，低于 64px 的返回空值
- [x] 2.3 SVG favicon 跳过尺寸检查，直接使用
- [x] 2.4 service/tools.go 中 LazyFetchLogo 调整：匹配到预设域名时跳过抓取
- [ ] 2.5 验证：添加低质量 favicon 网站时显示首字母 fallback 而非模糊图标

## 3. 首字母 fallback 视觉增强

- [x] 3.1 创建 hash-to-color 工具函数：工具名称 → 柔和背景色
- [x] 3.2 定义 10-12 色柔和色板，确保浅色/深色模式下白色文字都清晰
- [x] 3.3 修改 ToolItem 组件：imageError 时使用 hash 配色而非固定灰色
- [ ] 3.4 验证：多个无图标工具显示不同颜色，同一工具颜色一致

## 4. 品牌图标预设扩充

- [x] 4.1 从 Simple Icons 下载 200+ 品牌的 SVG 图标文件
- [x] 4.2 将现有 static/icons/brand/ 中的 PNG 文件替换为等效 SVG
- [x] 4.3 统一所有品牌图标文件命名为小写品牌名（如 github.svg、bilibili.svg）
- [x] 4.4 扩充 icon-presets.ts：添加 200+ 品牌的域名匹配规则
- [x] 4.5 更新 static/icons/icons.json 索引文件
- [ ] 4.6 验证：添加主流品牌网站 URL 时自动匹配到高质量 SVG 图标

## 5. IconPicker 搜索增强

- [x] 5.1 为 IconPicker 添加搜索输入框 UI
- [x] 5.2 实现跨来源搜索逻辑：同时搜索静态图标文件名、内置 SVG 名称、已有工具图标
- [x] 5.3 添加搜索无结果时的空状态提示
- [ ] 5.4 验证：搜索 "github"、"代码"、"music" 等关键词能正确返回结果
