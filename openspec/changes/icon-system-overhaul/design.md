## Context

Van Nav 当前的图标系统有 5 个互不关联的图标来源：@ant-design/icons（管理后台操作按钮）、@radix-ui/react-icons（管理后台侧边栏）、内联手写 SVG（浮动按钮/文件夹/分类图标）、IconPicker 40 个内置图标、以及 static/icons/ 下的品牌/引擎图标文件。品牌图标有 PNG 和 SVG 混用，部分 PNG 在高分辨率屏幕上模糊。favicon 抓取无质量检查，16x16 的模糊图标会被直接使用。

技术栈约束：React 18 + TypeScript + Vite，单二进制部署（前端通过 go:embed 内嵌），不能依赖运行时外部 API。

## Goals / Non-Goals

**Goals:**
- 统一所有 UI 图标来源为 Lucide，消除多库混用
- favicon 抓取增加质量门槛，消除模糊图标
- 首字母 fallback 视觉体验与有图标时接近
- 品牌图标预设大幅扩充，让用户添加工具时更大概率自动获得高质量图标
- IconPicker 搜索功能增强，让用户更快找到想要的图标

**Non-Goals:**
- 不引入 Iconify 运行时 API（违背单二进制离线部署原则）
- 不建立完整的 Icon Registry 注册表系统（对个人导航站过度设计）
- 不改管理后台的图标管理界面布局（后续单独迭代）
- 不做"一键升级所有品牌图标"功能（本轮只做自动匹配逻辑）

## Decisions

### 决策 1：UI 图标统一使用 Lucide

**选择：** lucide-react
**替代方案：** 继续使用 @ant-design/icons + @radix-ui/react-icons 混用
**理由：** Lucide 是目前 React 生态中最流行的纯线条风格图标库，tree-shaking 友好，风格与现有内置 SVG 一致（都是 stroke-based）。替换后减少两个依赖包，包体积减小。Lucide 内置 1500+ 图标，覆盖所有 UI 场景。

**改动范围：**
- @ant-design/icons 6 处引用 → Lucide 等效图标
- @radix-ui/react-icons 8 处引用 → Lucide 等效图标
- FloatingActions 4 个手写 SVG → Lucide 组件
- WidgetFolder 1 个手写 SVG → Lucide FolderOpen
- CategoryFilter 1 个手写 SVG → Lucide Settings

### 决策 2：favicon 质量过滤在后端 goscraper 中实现

**选择：** goscraper 抓取时检查 Content-Type 和 Content-Length 估算分辨率
**替代方案：** 前端 img onError 时降级
**理由：** 在源头过滤比在前端降级更可靠。goscraper 抓取 favicon 时已经下载了图片数据，可以在保存前检查。对 ICO 文件解析最小分辨率，对 PNG 检查尺寸头。低于 64px 的弃用，让系统直接走首字母 fallback。

**改动范围：**
- goscraper/goscraper.go：抓取 favicon 后增加尺寸检查函数
- service/tools.go：LazyFetchLogo 逻辑调整，质量不合格时返回空

### 决策 3：首字母 fallback 使用名称 hash 配色

**选择：** 对工具名称做简单 hash，映射到 10-12 种预设柔和色板
**替代方案：** 固定灰色背景
**理由：** 彩色首字母比灰色统一背景更有辨识度，用户可以靠颜色快速定位工具。Google Contacts、Slack 等应用都采用这个方案。hash 是确定性的，同一工具始终显示同一颜色。

**实现方式：** 前端 ToolItem 组件中，当 imageError 为 true 时，用名称 hash 从预设色板中取色，作为背景。文字为白色。

### 决策 4：品牌预设用静态 SVG 文件，不走外部 API

**选择：** 从 Simple Icons 仓库手动下载 SVG 文件，放入 static/icons/brand/
**替代方案：** 运行时从 Iconify API 或 Simple Icons CDN 获取
**理由：** Van Nav 是单二进制部署，运行时不能依赖外部图标 API。静态 SVG 文件通过 go:embed 打包进二进制，离线可用。

**预设扩充策略：**
- 国际品牌 50+（GitHub, YouTube, Twitter/X, Facebook, Instagram, Reddit, Discord, LinkedIn, Netflix, Spotify...）
- 国内品牌 50+（知乎, 豆瓣, 小红书, 淘宝, 天猫, 拼多多, 美团, 饿了么, 飞书, 钉钉...）
- 开发工具 50+（GitLab, Vercel, Netlify, Cloudflare, Docker Hub, npm, PyPI...）
- 自部署服务 30+（Portainer, Jellyfin, Nextcloud, Gitea, Home Assistant, Grafana...）

### 决策 5：IconPicker 搜索覆盖所有本地来源

**选择：** 搜索时同时检索静态图标文件名 + 内置 SVG 名称 + 已有工具图标
**替代方案：** 只搜索静态图标
**理由：** 用户不关心图标来自哪个"tab"，只想快速找到。统一搜索更符合用户预期。

## Risks / Trade-offs

- **Lucide 包体积** → Lucide 支持 tree-shaking，只引入使用的图标，预计增加 < 20KB gzipped
- **移除 @ant-design/icons 可能影响 Ant Design 组件内置图标** → Ant Design 5 的组件（如 Input、Select）不依赖 @ant-design/icons 包，可以安全移除
- **200+ SVG 文件增加前端构建体积** → 每个品牌 SVG 通常 1-3KB，总计约 400-600KB。通过 go:embed 打包不影响前端 bundle
- **favicon 分辨率检测对 ICO 格式需要特殊处理** → ICO 文件头包含尺寸信息，解析成本低。如果解析失败则按"质量未知"处理，不阻断流程
