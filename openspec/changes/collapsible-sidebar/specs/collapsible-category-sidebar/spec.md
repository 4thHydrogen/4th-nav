## ADDED Requirements

### Requirement: 桌面端默认收起为边线
系统 SHALL 在桌面端（>768px）默认将左侧分类导航栏收起为 4px 宽的半透明边线，内容区 `padding-left` SHALL 为 0。

#### Scenario: 页面初始加载
- **WHEN** 用户在桌面端加载页面
- **THEN** 左侧分类导航栏收起为 4px 边线，内容区占满全宽

#### Scenario: 显示选中分类暗示
- **WHEN** 导航栏处于收起状态且存在选中分类
- **THEN** 边线上对应选中分类位置 SHALL 显示亮色短线段

### Requirement: 鼠标悬停展开侧栏
系统 SHALL 在鼠标进入左侧触发区域时展开完整分类列表（88px 宽），覆盖在内容上方。

#### Scenario: 鼠标进入触发区域
- **WHEN** 鼠标进入左侧边线或触发区域
- **THEN** 侧栏 SHALL 在 200ms 内平滑展开到 88px 宽，显示完整分类列表

#### Scenario: 鼠标离开侧栏
- **WHEN** 鼠标离开侧栏区域
- **THEN** 侧栏 SHALL 在 1 秒延迟后收起为 4px 边线（200ms 动画）

#### Scenario: 鼠标离开后重新进入
- **WHEN** 鼠标离开侧栏但在 1 秒延迟期间重新进入
- **THEN** 收起计时器 SHALL 被取消，侧栏保持展开

### Requirement: 快捷键固定展开
系统 SHALL 支持通过快捷键切换侧栏的固定展开状态。

#### Scenario: 按快捷键固定
- **WHEN** 侧栏处于收起状态且用户按下指定快捷键
- **THEN** 侧栏 SHALL 展开并固定，鼠标离开不再触发收起

#### Scenario: 按快捷键取消固定
- **WHEN** 侧栏处于固定展开状态且用户再次按下快捷键
- **THEN** 侧栏 SHALL 恢复为悬停模式（鼠标离开后延迟收起）

### Requirement: 分类过滤功能保持不变
系统 SHALL 保持现有的分类过滤功能：选中分类后过滤内容区工具列表，支持多选和清除。

#### Scenario: 展开状态下选择分类
- **WHEN** 侧栏展开且用户点击分类按钮
- **THEN** 内容区 SHALL 按该分类过滤工具列表

#### Scenario: 选中分类后侧栏收起
- **WHEN** 用户选中分类后鼠标离开侧栏
- **THEN** 侧栏正常收起，但分类过滤结果 SHALL 保持不变

### Requirement: 设置按钮独立显示
系统 SHALL 将管理后台入口（齿轮图标）从侧栏分离，独立固定在 viewport 左下角。

#### Scenario: 桌面端显示设置按钮
- **WHEN** 页面在桌面端加载
- **THEN** 齿轮图标 SHALL 固定在 `left: 12px; bottom: 16px` 位置，与侧栏无关

#### Scenario: 侧栏展开时不遮挡设置按钮
- **WHEN** 侧栏展开且设置按钮在同一区域
- **THEN** 设置按钮 SHALL 被侧栏覆盖（侧栏 z-index 更高），用户可通过侧栏收起后访问
