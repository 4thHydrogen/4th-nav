# 4th Nav

轻量自部署导航页。适合作为浏览器主页或团队内部书签管理工具。

## 技术栈

- **后端**: Go + Gin + SQLite
- **前端**: React + Vite + TypeScript + Ant Design + React Query + Zustand
- **构建**: Docker 多阶段构建
- **部署**: 单体服务，Go 后端嵌入前端静态文件

## 功能

- 导航工具展示与管理
- 后台管理界面
- 分类管理
- 工具管理（增删改查、拖拽排序）
- 搜索引擎集成
- Dock 栏快捷访问
- 文件夹组织
- 布局拖拽
- 主题切换（亮色/暗色/自动）
- 背景图（支持 Pexels）
- PWA / Service Worker 离线支持
- 导入导出
- API Token 支持
- 移动端适配

## 本地开发

### 后端

```bash
go run .
```

默认端口 6412，可通过 `-port` 参数指定：

```bash
go run . -port 8080
```

### 前端

```bash
cd ui
pnpm install
pnpm dev
```

前端开发服务器会代理 `/api` 请求到后端。

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

打开浏览器访问 http://localhost:6412

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | JWT 签名密钥，**生产环境必须配置**，否则重启后登录态失效 | 随机生成 |

## 数据目录

数据存储在 `/app/data` 目录下：

- `nav.db` - SQLite 数据库

使用 Docker 部署时，请通过 `-v` 挂载持久化存储。

## 默认账号

- 用户名: `admin`
- 密码: `admin`

首次登录后请立即在后台修改密码。

## 构建发布

```bash
# 构建前端
cd ui && pnpm install --frozen-lockfile && pnpm build && cd ..

# 构建 Go 二进制
go build -o nav .
```

## 注意事项

- **JWT_SECRET**: 生产环境务必配置固定的 `JWT_SECRET`，否则每次重启服务后已登录用户的 token 会失效
- 数据库为 SQLite，适合个人或小团队使用，不建议高并发场景
- 单二进制部署，Go 后端会将前端静态文件嵌入到二进制中
