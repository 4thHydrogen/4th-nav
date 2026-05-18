## 1. 数据库与类型

- [x] 1.1 `database/init.db.go`：nav_setting 表新增 `proxy TEXT DEFAULT ''` 列（兼容已有数据库）
- [x] 1.2 `types/types.go`：Setting 结构体新增 `Proxy string` 字段
- [x] 1.3 `ui/src/types/index.ts`：前端 Setting 类型新增 `proxy: string`

## 2. 后端设置读写

- [x] 2.1 `service/settings.go`：GetSetting 查询新增 proxy 列，UpdateSetting 保存 proxy

## 3. HTTP 客户端代理

- [x] 3.1 新建 `utils/httpclient.go`：实现 `NewProxiedHttpClient(proxyURL string) *http.Client`，根据代理 URL 创建带代理的 HTTP 客户端
- [x] 3.2 `service/image.go`：LazyFetchLogo 开头读取 proxy 设置，传递给 checkIconQuality 使用
- [x] 3.3 `goscraper/goscraper.go`：修改 Scraper 新增 ProxyURL 字段，getDocument 中 HTTP 客户端使用代理
- [x] 3.4 `service/image.go`：getIcon 调用 goscraper.ScrapeWithProxy 传入 proxy

## 4. 前端 UI

- [x] 4.1 `ui/src/pages/admin/tabs/Setting.tsx`：在设置页添加代理地址输入框
