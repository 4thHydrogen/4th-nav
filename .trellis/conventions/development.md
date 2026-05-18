# Trellis 开发约定

> Van Nav 项目开发规范和约定。

## 工作流

1. **需求**：通过 OpenSpec 定义，不在代码中凭空创造需求
2. **任务**：通过 Trellis 任务系统管理，`task.py create/start/finish/archive`
3. **实现**：遵循现有代码风格和架构分层
4. **验证**：前端运行 `pnpm test`，后端 `go build` 确认编译通过
5. **记忆**：重要决策和经验写入 `.trellis/spec/` 或 `.trellis/memory/`

## 后端开发约定

### 分层职责

| 层级 | 目录 | 职责 |
|------|------|------|
| 路由 | `main.go` | 定义路由，挂载中间件 |
| 处理层 | `handler/` | HTTP 参数解析，调用 service，返回 JSON |
| 业务层 | `service/` | 业务逻辑、验证、标准化 |
| 数据层 | `database/` | SQL 执行，无业务逻辑 |
| 模型 | `types/` | 领域模型和 DTO 定义 |
| 工具 | `utils/` | JWT、通用工具函数 |

### 新增 API 端点清单

1. 在 `types/dto.go` 添加请求/响应 DTO（如有需要）
2. 在 `service/` 对应文件添加业务函数
3. 在 `handler/handlers.go` 添加处理函数
4. 在 `main.go` 注册路由
5. 在 `ui/src/types/index.ts` 同步 TypeScript 类型
6. 在 `ui/src/utils/api.tsx` 添加 API 调用函数
7. 在 `ui/src/queries/index.ts` 封装 React Query hook（如需）

### 数据库变更

- 所有 schema 变更通过 `database/init.db.go` 中的 `InitDB()` 函数
- 使用 `columnExists()` 检查列是否存在后再 `ALTER TABLE`
- 不使用版本化迁移工具
- SQLite 限制：不支持 `DROP COLUMN`（旧版本），注意兼容性

### API 响应格式

```go
// 成功
c.JSON(200, gin.H{"success": true, "data": result})

// 失败
c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "错误信息"})

// 未认证
c.JSON(http.StatusUnauthorized, gin.H{"success": false, "errorMessage": "未登录"})
```

## 前端开发约定

### 组件结构

```
ui/src/components/ComponentName/
├── index.tsx    # 组件实现
└── index.css    # 组件样式（Tailwind + 自定义 CSS）
```

### 状态管理选择

| 数据类型 | 管理方式 | 位置 |
|----------|----------|------|
| 服务端数据 | TanStack React Query | `queries/index.ts` |
| 客户端 UI 状态 | Zustand | `stores/ui.ts` |
| 组件局部状态 | React useState | 组件内部 |

### 类型同步规则

- Go 结构体 JSON 标签 ↔ TypeScript interface 字段必须一一对应
- 新增/修改字段时两端同步更新
- `types/types.go` 对应 `ui/src/types/index.ts` 中的实体类型
- `types/dto.go` 对应 `ui/src/types/index.ts` 中的 DTO 类型

### CSS 约定

- 优先使用 Tailwind 工具类
- 组件特定样式写在组件目录的 `index.css` 中
- 全局样式在 `ui/src/index.css`
- 主题通过 body class 切换（`dark-mode` class）

## 测试约定

### 前端测试

- 框架：Vitest + jsdom + @testing-library/react
- 位置：`ui/src/__tests__/`
- 命名：`{模块名}.test.ts(x)`
- 风格：`describe`/`it`/`expect`，Arrange-Act-Assert 模式
- Mock 数据内联定义

### 后端

- 当前无测试框架
- 新功能建议至少手动通过 `go build` 验证编译

## Git 约定

- 提交格式：`<type>: <描述>`（feat、fix、refactor、docs、test、chore、perf、ci）
- 中文描述可接受
- 不强制要求 co-author 标注
