# Quickstart: 毛玻璃主题与 Pexels 壁纸验证

**Feature**: 004-glassmorphism-wallpaper

## Phase A: Pexels 壁纸基础功能

### 步骤

1. 启动项目
2. 打开设置页，填入 Pexels API Key
3. 在背景 URL 输入 `pexels`
4. 开启"背景图片"开关
5. 保存设置，返回首页

### 预期结果

- 首页显示 Pexels 壁纸（landscape 方向）
- 壁纸加载过程中有渐变背景 fallback
- 加载完成后平滑淡入（320ms）
- 右下角显示 "Photo by xxx on Pexels"（小字、低透明度）

## Phase B: 主题感知

### 步骤

1. 当前为亮色主题，观察壁纸色调（应偏浅色/明亮）
2. 切换到暗色主题
3. 等待壁纸更新

### 预期结果

- 亮色主题壁纸偏浅色（color=white/gray）
- 暗色主题壁纸偏深色（color=black/gray）
- 切换不闪白（旧壁纸保持到新壁纸就绪）
- 右下角 attribution 随壁纸一起更新

## Phase C: 手动刷新

### 步骤

1. 打开设置页
2. 点击"换一张"按钮
3. 返回首页

### 预期结果

- 壁纸更换为新的 Pexels 图片
- 旧壁纸保持显示直到新壁纸加载完成
- 新壁纸加载后平滑替换

## Phase D: 毛玻璃效果

### 步骤

1. 确认背景图片已开启
2. 开启"毛玻璃效果"开关
3. 观察各组件外观

### 预期结果

- 所有 widget card 半透明 + 模糊背景
- folder 卡片同样半透明
- search bar 半透明
- dock bar 半透明
- context menu 半透明
- 暗色主题下对比度足够（文字清晰可读）
- 亮色主题下保持清爽

### 需检查的组件

- [ ] WidgetTool 卡片
- [ ] WidgetFolder 卡片
- [ ] SearchBar
- [ ] DockBar
- [ ] FolderFloatingWindow
- [ ] SettingsButton
- [ ] ToolContextMenu

## Phase E: 降级与性能

### 步骤

1. 在移动端（或窄窗口 <768px）查看
2. 在不支持 backdrop-filter 的浏览器查看（可模拟）

### 预期结果

- 移动端 blur 降为 12px
- 不支持 backdrop-filter 时使用更强不透明背景
- 所有情况下文字可读性正常
