## ADDED Requirements

### Requirement: 移动端浮动按钮
系统 SHALL 在移动端（<=768px）左上角显示一个浮动按钮作为分类导航入口。

#### Scenario: 页面初始加载
- **WHEN** 用户在移动端加载页面
- **THEN** 左上角 SHALL 显示一个浮动按钮（约 40x40px），顶部横排分类栏 SHALL 不再显示

#### Scenario: 浮动按钮样式
- **WHEN** 浮动按钮显示在页面上
- **THEN** 按钮 SHALL 使用毛玻璃背景效果，包含分类图标（如 list/grid 图标）

### Requirement: 点击弹出下拉菜单
系统 SHALL 在点击浮动按钮后弹出下拉菜单，显示所有分类列表和管理后台入口。

#### Scenario: 点击按钮打开菜单
- **WHEN** 用户点击浮动按钮
- **THEN** 下拉菜单 SHALL 从按钮位置弹出，显示完整分类列表

#### Scenario: 菜单内容
- **WHEN** 下拉菜单展开
- **THEN** 菜单 SHALL 包含：分类列表（含"全部"选项）和底部的管理后台入口

#### Scenario: 当前选中分类高亮
- **WHEN** 下拉菜单展开且有选中分类
- **THEN** 选中分类 SHALL 高亮显示

### Requirement: 关闭下拉菜单
系统 SHALL 支持多种方式关闭下拉菜单。

#### Scenario: 点击分类后关闭
- **WHEN** 用户在下拉菜单中点击某个分类
- **THEN** 菜单 SHALL 关闭，内容区按该分类过滤

#### Scenario: 点击遮罩关闭
- **WHEN** 下拉菜单展开且用户点击菜单外的遮罩区域
- **THEN** 菜单 SHALL 关闭，不改变当前分类过滤

#### Scenario: 点击浮动按钮关闭
- **WHEN** 下拉菜单展开且用户再次点击浮动按钮
- **THEN** 菜单 SHALL 关闭，不改变当前分类过滤

### Requirement: 管理后台入口整合
系统 SHALL 在移动端将管理后台入口整合进下拉菜单底部。

#### Scenario: 菜单中显示管理后台
- **WHEN** 下拉菜单展开
- **THEN** 菜单底部 SHALL 显示管理后台链接（齿轮图标 + 文字）

#### Scenario: 点击管理后台
- **WHEN** 用户点击菜单中的管理后台入口
- **THEN** 页面 SHALL 导航到 `/admin`
