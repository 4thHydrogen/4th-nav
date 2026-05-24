# 4th Nav

一个轻量的自部署导航页项目，适合作为浏览器首页、团队书签面板，或个人工具入口。

## 技术栈

- 后端：Go + Gin + SQLite
- 前端：React 18 + Vite + TypeScript + Ant Design
- 数据获取：React Query
- 瞬时界面状态：Zustand
- 构建与部署：单体服务，Go 嵌入前端静态资源

## 当前架构

### 后端

- `handler/`：HTTP 参数解析、响应编码
- `service/`：业务编排与规则
- `repository/`：SQLite 访问
- `database/`：建库、迁移、初始化
- `types/`：公共 DTO 与领域结构

### 前端

- `pages/`：页面入口（首页、后台、登录）
- `features/`：业务功能模块
- `components/`：仍在复用的通用组件
- `shared/`：API、样式 token、基础 UI
- `entities/`：前端 normalize / adapter 层

## 功能

- 导航工具展示与管理
- 分类与排序
- Dock 快捷访问
- 文件夹分组与展开
- 网格布局拖拽
- 搜索引擎切换
- 主题与背景图
- PWA / Service Worker 支持
- 后台管理界面
- API Token 支持
- 导入导出

## 本地开发

### 后端

```bash
go run .
```

默认监听 `6412` 端口，也可以自定义：

```bash
go run . -port 8080
```

### 前端

```bash
cd ui
corepack pnpm install
corepack pnpm dev
```

前端开发服务器默认运行在 `2333`，并代理 `/api` 到本地后端。

## 构建

### 一键构建

```bash
make build
```

这会：

1. 构建前端并输出到仓库根目录 `public/`
2. 构建 Go 二进制 `nav`

### 手动构建

```bash
cd ui
corepack pnpm install --frozen-lockfile
corepack pnpm build
cd ..
go build -o nav .
```

## Docker 部署

```bash
docker run -d \
  --name 4th-nav \
  --restart always \
  -p 6412:6412 \
  -v /path/to/data:/app/data \
  -e JWT_SECRET="your-long-random-secret" \
  4thhydrogen/4th-nav:latest
```

部署后访问 [http://localhost:6412](http://localhost:6412)。

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `JWT_SECRET` | JWT 签名密钥。生产环境必须固定配置。 | 启动时随机生成 |

## 数据目录

默认数据目录为 `/app/data`：

- `nav.db`：SQLite 数据库

Docker 部署时请务必通过 `-v` 做持久化挂载。

## 默认账户

- 用户名：`admin`
- 密码：`admin`

首次登录后请立即修改密码。

## 注意事项

- 生产环境必须固定 `JWT_SECRET`，否则服务重启后已有登录态会失效
- 前端构建产物输出到根目录 `public/`，Go 服务通过 `embed` 直接提供静态资源
- 本项目适合个人或小团队场景，不建议直接用于高并发部署
