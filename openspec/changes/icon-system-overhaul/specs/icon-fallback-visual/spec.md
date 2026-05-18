## ADDED Requirements

### Requirement: 首字母 fallback 自动配色
当工具图标加载失败或未设置图标时，首字母 fallback SHALL 使用基于工具名称 hash 的柔和背景色。同一工具名称 SHALL 始终显示相同的颜色。

#### Scenario: 工具图标加载失败
- **WHEN** 一个名为"GitHub"的工具图标加载失败
- **THEN** 显示大写字母"G"，背景为基于"GitHub" hash 的柔和颜色，文字为白色

#### Scenario: 不同名称显示不同颜色
- **WHEN** 页面上有多个使用首字母 fallback 的工具（如"GitHub"、"YouTube"、"Bilibili"）
- **THEN** 每个工具的首字母背景色不同，帮助用户靠颜色区分

#### Scenario: 相同名称始终相同颜色
- **WHEN** 同一个工具在页面的不同位置显示（如主视图和搜索结果中）
- **THEN** 首字母 fallback 的背景色完全一致

### Requirement: 色板柔和且区分度高
预设色板 SHALL 包含 10-12 种颜色，颜色 SHALL 在浅色和深色模式下都清晰可辨，饱和度适中不刺眼。

#### Scenario: 浅色模式下的显示
- **WHEN** 页面处于浅色模式
- **THEN** 首字母 fallback 的背景色柔和，白色文字清晰可读

#### Scenario: 深色模式下的显示
- **WHEN** 页面处于深色模式
- **THEN** 首字母 fallback 的背景色依然清晰，白色文字与背景有足够对比度
