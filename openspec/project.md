# OpenSpec — 项目定义

> Van Nav 的产品需求真相源。

## 项目信息

- **名称**：Van Nav
- **类型**：导航站 / 书签首页应用
- **仓库**：github.com/mereithhh/van-nav（上游）
- **当前版本**：1.6.1
- **维护者**：hydrogen

## 产品定位

轻量级个人导航页，适合作为浏览器主页使用。单二进制部署，零外部依赖（除可选的 Pexels API）。

## 核心功能

| 功能 | 描述 |
|------|------|
| 工具管理 | 增删改查书签/工具，支持图标模式和卡片模式 |
| 分类管理 | 工具按分类组织，支持排序和隐藏 |
| 文件夹 | 工具可归入文件夹，文件夹支持展开/折叠 |
| 搜索引擎集成 | 多搜索引擎切换，可自定义搜索引擎 |
| Dock 栏 | 底部快捷访问栏 |
| 暗色主题 | 自动/手动主题切换 |
| 背景图片 | 支持自定义背景和毛玻璃效果 |
| 拼音搜索 | 支持拼音模糊匹配 |
| 网站信息抓取 | 自动获取网站标题、描述和 Logo |
| 导入导出 | 工具数据批量导入导出 |
| API Token | 支持通过 API Token 进行接口调用 |
| PWA | 支持离线使用和安装 |
| 网格布局 | 可拖拽的 Widget 网格布局 |

## 用户角色

| 角色 | 权限 |
|------|------|
| 访客 | 查看首页、搜索、使用书签 |
| 管理员 | 后台管理（工具/分类/设置/搜索引擎/Dock 栏）|

## 技术约束

- **存储**：SQLite 单文件，不支持多实例共享数据库
- **认证**：JWT 无状态认证，无 OAuth/SSO
- **前端部署**：通过 `go:embed` 嵌入二进制，不支持独立部署前端
- **并发**：单进程，Gin 框架自带并发处理
- **API 格式**：RESTful JSON，统一信封 `{success, data, errorMessage}`

## API 结构

```
公开接口：
GET  /api/                    # 获取首页数据（工具、分类、设置、站点配置）
POST /api/login               # 登录
GET  /api/logout              # 登出
GET  /api/img                 # 获取 Logo 图片
GET  /api/searchEngines       # 获取启用的搜索引擎

管理接口（需 JWT/API Token 认证）：
GET  /api/admin/all           # 获取全部管理数据
工具 CRUD：    POST/PUT/DELETE /api/admin/tool[/:id]
分类 CRUD：    POST/PUT/DELETE /api/admin/catelog[/:id]
搜索引擎 CRUD：POST/PUT/DELETE /api/admin/searchEngine[/:id]
Dock 栏：      POST/DELETE     /api/admin/dock[/:id]
设置：         PUT             /api/admin/setting
站点配置：     PUT             /api/admin/siteConfig
用户：         PUT             /api/admin/user
API Token：    POST/DELETE     /api/admin/apiToken[/:id]
导入导出：     GET/POST        /api/admin/exportTools | importTools
布局：         PUT             /api/admin/layout
排序：         PUT             /api/admin/tools/sort | searchEngines/sort | dock/sort
```

## 数据模型

### 核心实体

- **Tool**：书签/工具（id, name, url, logo, catelog, desc, sort, hide, viewMode, type, parentId, size, bgColor, gridX, gridY）
- **Catelog**：分类（id, name, sort, hide）
- **Setting**：全局设置（标题、Logo、背景、主题开关等）
- **SiteConfig**：站点配置（无图模式、紧凑模式、每行列数、图标大小）
- **SearchEngine**：搜索引擎（id, name, baseUrl, queryParam, logo, sort, enabled）
- **User**：用户（id, name, password）
- **Token**：API Token（id, name, value, disabled）
- **DockItem**：Dock 栏项目（id, sort, toolId, 关联 Tool 信息）

### 关系

- Tool 属于 Catelog（通过 catelog 字段字符串关联）
- Tool 可属于 Folder（通过 parentId 字段）
- DockItem 关联 Tool（通过 toolId）

## 非功能需求

- **性能**：单页应用，首屏加载 < 2s
- **可用性**：键盘快捷键支持（任意键聚焦搜索、回车打开第一个结果、Ctrl+数字打开指定结果）
- **兼容性**：PC、平板、手机响应式布局
- **部署**：Docker 一键部署，单二进制直接运行
