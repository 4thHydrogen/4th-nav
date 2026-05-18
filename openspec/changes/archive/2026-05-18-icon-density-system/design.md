## Context

Van Nav 前端使用响应式网格布局（12/8/5/3 列断点），每个网格单元内放置 icon 组件（WidgetTool 1×1）或文件夹组件（WidgetFolder M×N）。当前 icon 大小通过 `--icon-size` CSS 变量控制，但存在三个问题：

1. **设置不生效**：各组件 fallback 值不一致（44/48/56px），WidgetTool large 模式硬编码 48px
2. **设计不合理**：管理后台让用户选择像素值（32/40/44/52/60），用户不应该关心像素
3. **缺乏通用体系**：文件夹尺寸公式混用 `--cell-width` 和 `--row-height`，未来新组件无规范可循

现有尺寸体系涉及三个独立来源：`--icon-size`(44px)、`ROW_HEIGHT`(80px)、`--cell-width`(~89px)，它们互不关联。

## Goals / Non-Goals

**Goals:**
- 建立统一的尺寸基准：`--icon-size` 由 density + 容器宽度自动推导，所有组件只读这一个值
- 密度设置（紧凑/标准/宽松）替代像素值设置，用户操作更直观
- 提供 M×N 通用尺寸公式：`W × --icon-size + (W-1) × --icon-gap`，所有组件复用
- ROW_HEIGHT 和 MARGIN 根据密度自适应，保持视觉比例一致

**Non-Goals:**
- 不修改 WidgetTool 的横向/纵向布局逻辑（大尺寸卡片的横排设计后续单独处理）
- 不改变网格列数断点体系（COLS = {lg:12, md:8, sm:5, xs:3}）
- 不改变拖拽、排序、文件夹展开等交互逻辑

## Decisions

### Decision 1: density 字段替代 iconSize

**选择**: 后端新增 `density TEXT NOT NULL DEFAULT 'standard'`，废弃 `iconSize INTEGER`。

**备选方案**:
- A) 保留 iconSize 但改为相对值（S/M/L/XL）→ 需要额外映射层，不如直接用语义化名称
- B) 完全移除设置，纯自动 → 用户无法表达密度偏好，缺少控制感

**理由**: 语义化密度名称（compact/standard/relaxed）直接表达用户意图，后端存储简单字符串，前端映射为具体参数。

### Decision 2: 三个 CSS 变量作为全局尺寸基准

**选择**: 在 `.desktop-page` 上设置三个 CSS 变量：
- `--icon-size`: 基准 icon 尺寸（自动计算）
- `--icon-gap`: 组件内部子 icon 间距
- `--row-height`: 网格行高（不再硬编码 80px）

所有组件只读这三个变量，不自定义。

**理由**: 三个变量覆盖所有尺寸需求——`--icon-size` 控制 icon 本身，`--icon-gap` 控制内部间距，`--row-height` 控制网格行高。未来新组件只需遵守同一公式。

### Decision 3: 通用尺寸公式

**选择**: 任何 M×N 组件的 icon 区域尺寸统一为：
```
width  = M × var(--icon-size) + (M - 1) × var(--icon-gap)
height = N × var(--icon-size) + (N - 1) × var(--icon-gap)
```

每个组件通过 `--grid-w` 和 `--grid-h` CSS 自定义属性声明自己的尺寸。

**理由**: 1×1 → base，2×2 → 2×base+gap，3×2 → 3×base+2×gap。同一公式覆盖所有情况。文件夹、未来新组件都用同一个 calc()。

### Decision 4: 密度参数映射

**选择**: 密度通过影响 ROW_HEIGHT 来间接控制 --icon-size：

| 密度 | ROW_HEIGHT | --icon-size (≈60%) | --icon-gap | MARGIN |
|------|-----------|-------------------|------------|--------|
| compact | 64px | 38px | 4px | [8, 8] |
| standard | 80px | 48px | 6px | [12, 12] |
| relaxed | 100px | 62px | 8px | [16, 16] |

--icon-size = ROW_HEIGHT - label空间(≈18px) - padding(≈14px)

**理由**: 行高变化时 icon 自然跟着变，标签空间保持固定。MARGIN 也随密度缩放，保持整体比例一致。

### Decision 5: 自适应计算在 Content 组件完成

**选择**: 在 `Content/index.tsx` 的 useEffect 中，根据 `data?.siteConfig?.density` 和容器实际宽度，计算并设置 CSS 变量到 `.desktop-page` 元素。

**理由**: Content 组件是唯一知道容器宽度和 density 设置的地方，useEffect 机制确保响应式更新。

## Risks / Trade-offs

- **[数据库迁移]** 旧 `iconSize` 列废弃但保留，新增 `density` 列 → 迁移脚本用 `ALTER TABLE ADD COLUMN`，无破坏性
- **[视觉变化]** 标准 density 下 --icon-size 从 44px 变为 48px → 微调，可接受
- **[文件夹公式变更]** 文件夹尺寸从 `--cell-width` 改为 `--icon-size` → 视觉上文件夹会变小（更紧凑），符合"齐平"设计意图
- **[useGridLayout 常量化]** ROW_HEIGHT 和 MARGIN 从 JS 常量改为从 CSS 变量读取 → 需要在 JS 中同步读取 computed style，增加少量复杂度
