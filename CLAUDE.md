# Van Nav — 项目规则

## 真相源

- **OpenSpec** (`openspec/`) 是产品需求、行为变更、验收标准和架构决策的唯一真相源。
- **Trellis** (`.trellis/`) 负责执行工作流、任务上下文、验证和会话记忆。
- 不要在 OpenSpec 之外凭空捏造需求。

## 项目概述

Van Nav 是一个轻量导航站/书签首页应用。单二进制文件，内嵌前端，SQLite 存储。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Go 1.25、Gin、SQLite (modernc.org/sqlite, 纯 Go)、JWT 认证 |
| 前端 | React 18、TypeScript、Vite、Ant Design 5、Tailwind CSS 3、Zustand、TanStack React Query、Framer Motion、@dnd-kit |
| 包管理 | pnpm（前端）、Go modules（后端）|
| 数据库 | SQLite — 文件位于 `./data/nav.db`，WAL 模式 |
| 部署 | Docker 多阶段构建，单 Alpine 二进制，或直接 `go run main.go` |
| 测试 | Vitest + @testing-library/react（前端），后端暂无测试框架 |

## 项目结构

```
.
├── main.go              # 入口，Gin 路由，通过 go:embed 内嵌前端
├── serve.go             # 静态文件服务中间件（SPA fallback）
├── handler/handlers.go  # HTTP 处理层（薄层，调用 service）
├── service/             # 业务逻辑（tools、catelog、settings、auth、dock、site_config）
├── database/            # SQLite 初始化、迁移、原生 SQL 操作
├── middleware/auth.go    # JWT + API Token 中间件
├── types/types.go       # 领域模型（Go 结构体）
├── types/dto.go         # 请求/响应 DTO
├── utils/               # JWT、SVG、通用工具函数
├── logger/              # 简单日志
├── goscraper/           # 网站元数据抓取器
├── ui/                  # React 前端
│   ├── src/
│   │   ├── components/  # 功能组件（Content、SearchBar、ToolItem 等）
│   │   ├── pages/       # 页面：Home、Login、Admin（含子标签页）
│   │   ├── stores/      # Zustand 状态仓库（ui.ts）
│   │   ├── queries/     # TanStack React Query hooks
│   │   ├── utils/       # API 客户端、搜索引擎、主题、工具函数
│   │   ├── types/       # TypeScript 类型定义（镜像 Go 类型）
│   │   └── __tests__/   # Vitest 测试文件
│   └── vite.config.ts   # 开发服务器代理 /api 到后端 :6412
├── mtab/                # 旧版 PHP 代码库（ThinkPHP），已不使用
└── Dockerfile           # 多阶段：node 构建 → go 构建 → alpine 运行时
```

## 开发命令

```bash
# 后端
go run main.go                    # 启动，监听 :6412
go build .                        # 构建二进制

# 前端
cd ui && pnpm install             # 安装依赖
cd ui && pnpm dev                 # 开发服务器 :2333（/api 代理到 :6412）
cd ui && pnpm build               # 生产构建 → ui/build/

# 测试
cd ui && pnpm test                # 运行所有 Vitest 测试
cd ui && pnpm test:watch          # 监听模式

# Docker
docker build -t van-nav .
docker run -d -p 6412:6412 -v ./data:/app/data van-nav
```

## 架构规则

### 后端 (Go/Gin)

- **handler/**：仅 HTTP 层。解析参数，调用 service，返回 JSON。不含业务逻辑。
- **service/**：业务逻辑层。负责验证、标准化、编排。
- **database/**：使用 `database/sql` 原生 SQL。无 ORM。Schema 通过 `InitDB()` 的列存在性检查做迁移。
- **types/**：领域模型和 DTO。JSON 标签必须与前端 TypeScript 类型一致。
- API 响应统一使用 `gin.H{"success": bool, "data": ..., "errorMessage": ...}` 信封格式。
- 认证：JWT 令牌（30 天有效期）+ API Token。中间件在 `middleware/auth.go`。
- JWT 密钥：环境变量 `JWT_SECRET`，未设置则启动时随机生成（重启后令牌失效）。

### 前端 (React/TypeScript)

- **types/index.ts** 是 TypeScript 类型的唯一来源，必须与 Go 的 `types/types.go` 和 `types/dto.go` 保持同步。
- **utils/api.tsx** 是 API 客户端，所有后端调用必须通过此文件的函数。Token 存储在 `localStorage._token`。
- **queries/index.ts** 将 API 调用封装为 TanStack React Query hooks，支持乐观更新。
- **stores/ui.ts** 是 Zustand 状态仓库，管理客户端 UI 状态（右键菜单、文件夹、分类过滤、搜索）。
- 组件遵循 `ComponentName/index.tsx` + `index.css` 同目录组织模式。
- 状态管理：Zustand 管客户端 UI 状态，React Query 管服务端状态。
- 不使用 `React.FC`。使用普通函数组件 + 类型化的 props interface。
- 路径别名：`@/` 映射到 `ui/src/`。

### 跨层规则

- 新增字段时，需同步更新 `types/types.go`（或 `types/dto.go`）、`ui/src/types/index.ts` 以及 `database/` 中相关 SQL。
- 后端路由定义在 `main.go`，前端路由定义在 `ui/src/App.tsx`。
- 搜索引擎、Dock 栏、文件夹功能横跨后端 handler → service → database 和前端 api → queries → components。

## 测试约定

- 测试文件位于 `ui/src/__tests__/*.test.ts(x)`。
- 框架：Vitest + jsdom 环境 + @testing-library/jest-dom 匹配器。
- 风格：使用 `describe`/`it`/`expect`，mock 数据内联定义。
- Go 后端目前无测试。
- 运行：`cd ui && pnpm test`。

## 部署方式

- Docker：多阶段构建（node → go → alpine）。暴露 6412 端口。数据卷在 `/app/data`。
- 二进制：`go build .` 生成 `nav` 可执行文件，直接运行。
- 数据库首次运行时自动创建在 `./data/nav.db`。
- 默认账号密码：admin/admin（首次登录后请修改）。
- 支持 PWA（构建时通过 Workbox 生成 Service Worker）。

## 编码约定

- Go：标准 Go 格式化，中文注释可接受。
- TypeScript：当前 `strict: false`，但导出函数和组件 props 应使用显式类型。
- CSS：Tailwind 工具类 + 组件局部 `index.css`。不使用全局 CSS modules。
- 命名：Go 中使用 `Catelog`（历史拼写保留，不做修改），前端保持同步。
- 提交：遵循 conventional commits（`feat:`、`fix:`、`refactor:` 等）。
