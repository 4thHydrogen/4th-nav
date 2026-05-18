## Context

Van Nav 的图标获取涉及多个 HTTP 请求：goscraper 抓取目标网页、HEAD 请求探测常见路径、Google Favicon API 兜底。在中国大陆环境下，这些请求经常超时或被屏蔽，导致图标获取失败。

现有代码中每个 HTTP 客户端都是独立创建的 `&http.Client{}`，没有统一的代理配置入口。

## Goals / Non-Goals

**Goals:**
- 用户可在管理后台设置页配置 HTTP 代理地址
- 所有图标获取相关的 HTTP 请求都通过该代理
- 代理为空时不走代理（直连）

**Non-Goals:**
- 不做 SOCKS5 认证（本轮只支持简单 URL 格式的代理）
- 不做按域名区分是否走代理
- 不影响非图标获取的 HTTP 请求（如前端静态资源）

## Decisions

### 决策 1：代理存储在 nav_setting 表

**选择：** 在 `nav_setting` 表新增 `proxy` TEXT 列
**理由：** 与其他系统设置（背景图、Pexels API Key 等）统一管理，复用现有的设置读写流程。

### 决策 2：统一的代理 HTTP 客户端工厂函数

**选择：** 新建 `utils/httpclient.go`，提供 `NewHttpClient() *http.Client` 函数，内部读取数据库 proxy 设置，返回配置好代理的客户端
**替代方案：** 在每个使用点单独读取代理设置
**理由：** 集中管理，新增网络请求时不会遗漏代理配置。

### 决策 3：goscraper 通过参数传递代理

**选择：** 修改 `Scrape()` 函数签名，接受可选的 proxy 参数
**理由：** goscraper 是独立包，不应直接依赖 database 包。由调用方传入代理配置更合理。

## Risks / Trade-offs

- **每次创建 HTTP 客户端都查数据库** → 查询极轻量（单行读取 + SQLite 缓存），影响可忽略
- **代理地址格式错误** → Go 的 `http.ProxyURL` 会返回连接错误，不影响主流程
