## Why

在中国大陆环境下，图标获取流程中的所有网络请求（goscraper 抓取网页、路径探测、Google Favicon API）都可能因网络问题失败或超时，导致大多数网站图标无法获取，退回到首字母 fallback。用户需要一个代理设置，让这些请求通过代理进行。

## What Changes

- 在 `nav_setting` 表中新增 `proxy` 字段（TEXT，存储代理 URL 如 `http://127.0.0.1:7890`）
- 后端 Setting 结构体新增 `Proxy` 字段
- goscraper、image.go 中所有 HTTP 客户端读取代理设置，配置 `http.Transport` 使用代理
- 前端管理后台设置页新增代理地址输入框

## Capabilities

### New Capabilities
- `proxy-for-icon-fetch`: 图标获取网络请求的代理配置

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- `database/init.db.go`：nav_setting 表加 proxy 列
- `types/types.go`：Setting 结构体加 Proxy 字段
- `service/settings.go`：读取/保存 proxy
- `goscraper/goscraper.go`：getDocument() 的 HTTP client 使用代理
- `service/image.go`：checkIconQuality、probeCommonIconPaths、fetchGoogleFavicon 的 HTTP client 使用代理
- `ui/src/types/index.ts`：Setting 类型加 proxy
- `ui/src/pages/admin/tabs/Setting.tsx`：代理输入框
