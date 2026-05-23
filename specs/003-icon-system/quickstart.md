# Quickstart: Icon 系统增强验证

**Feature**: 003-icon-system

## Phase A: 基础验证 — 自动获取高清 icon

### 步骤

1. 启动项目：`go run main.go`
2. 打开管理页面，新增工具：
   - 名称：GitHub Test，URL：https://github.com，Logo 留空
3. 等待 5-10 秒（异步获取）
4. 刷新页面
5. 检查 GitHub 图标是否为清晰 SVG 或高分辨率 PNG

### 预期结果

- 图标清晰（非模糊 16x16）
- `/api/img?url=...` 返回图片
- 后端日志显示获取路径（如 "manifest 512x512" 或 "brand preset"）

### 测试网站

| 网站 | 预期来源 | 说明 |
|------|----------|------|
| https://github.com | 品牌预设 SVG | 已有预设 |
| https://www.bilibili.com | 品牌预设 | 已有预设 |
| https://vite.dev | Manifest/HTML | 小众网站测试 |
| https://tailwindcss.com | Manifest/HTML | 现代网站 |
| https://www.apple.com | Apple Touch Icon | 大型网站 |
| https://example.invalid | 所有方式失败 | 显示首字母 fallback |

## Phase B: /api/img 自动补缓存

### 步骤

1. 清空 nav_img 表：`DELETE FROM nav_img;`
2. 不清空 nav_table.logo
3. 刷新首页
4. 观察图标逐步恢复

### 预期结果

- 第一次请求某个 /api/img 可能稍慢（后台下载）
- 下载成功后图片正常显示
- 后续请求命中缓存直接返回

## Phase C: 批量管理

### 步骤

1. 打开后台管理页
2. 点击"清空图标缓存"（mode=cache-only），确认
3. 刷新首页，确认图标全部显示首字母 fallback
4. 点击"重新获取缺失图标"
5. 等待任务完成（查看状态接口）
6. 刷新首页，确认大部分图标恢复

### 预期结果

- 清空缓存后页面不显示破图
- 批量任务在后台执行，不阻塞页面
- 任务状态接口返回 total/done/success/failed
- 失败项有错误原因
- 成功项图标清晰显示

## Phase D: 强制重抓所有 icon

### 步骤

1. 点击"强制重新获取全部图标"，确认二次弹窗
2. 等待任务完成
3. 检查结果

### 预期结果

- 所有非文件夹、非空 url 的工具 icon 被重新获取
- 跳过 url=admin 的特殊工具
- 之前失败的网站有重试机会
