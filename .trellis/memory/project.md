# Trellis 项目记忆

> Van Nav 项目上下文，供 Trellis 工作流使用。

## 项目身份

- **项目名**：Van Nav
- **类型**：Go + React 单体应用
- **上游**：github.com/mereithhh/van-nav
- **当前 Fork 维护者**：hydrogen

## 技术栈快照

| 维度 | 技术 |
|------|------|
| 后端语言 | Go 1.25 |
| 后端框架 | Gin |
| 数据库 | SQLite（modernc.org/sqlite，纯 Go 实现）|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 8 |
| UI 库 | Ant Design 5 + Tailwind CSS 3 |
| 状态管理 | Zustand（客户端 UI）、TanStack React Query（服务端数据）|
| 包管理 | pnpm |
| 测试 | Vitest + @testing-library/react |
| 认证 | JWT（HS256）+ API Token |
| 部署 | Docker 多阶段构建 / 单二进制 |

## 架构要点

- 前端通过 `go:embed` 嵌入 Go 二进制，不支持独立部署
- SQLite 单文件存储，WAL 模式，无需外部数据库服务
- API 响应统一信封：`{success, data, errorMessage}`
- 无 ORM，database/ 包使用原生 SQL
- Schema 迁移通过 `InitDB()` 中的列存在性检查实现（非版本化迁移）
- 历史遗留：`Catelog` 拼写（应为 Catalog）在整个项目中保留不修改

## 目录约定

- 后端包按职责分层：`handler/` → `service/` → `database/`
- 前端组件：`ui/src/components/ComponentName/index.tsx` + `index.css`
- 前端类型：`ui/src/types/index.ts`（单一来源，镜像 Go 类型）
- 前端 API：`ui/src/utils/api.tsx`（统一 API 客户端）
- 测试：`ui/src/__tests__/*.test.ts(x)`

## 开发环境

- 后端默认端口：6412
- 前端开发服务器端口：2333（代理 /api 到 6412）
- 数据库文件：`./data/nav.db`（自动创建）
- 默认管理员：admin / admin

## 注意事项

- Go 后端目前无测试覆盖
- TypeScript `strict: false`，需注意类型安全
- mtab/ 目录是旧版 PHP 代码，不影响当前项目
- `goscraper/` 用于抓取网站元信息（标题、描述、Logo）
