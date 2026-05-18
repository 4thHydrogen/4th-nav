## 1. 桌面端折叠侧栏 — CSS 与结构

- [x] 1.1 重写 `CategoryFilter/index.css`：桌面端默认收起（4px 边线 + 88px 展开态），添加 hover 展开过渡动画（200ms ease），覆盖模式（z-index 层叠）
- [x] 1.2 修改 `CategoryFilter/index.tsx`：添加收起/展开状态管理（`isExpanded`），添加鼠标进入/离开事件处理（1s 延迟收起），收起态渲染 4px 边线含选中分类亮色短线
- [x] 1.3 修改 `Content/index.css`：`.desktop-page` 的 `padding-left` 从 96px 改为 24px（桌面端侧栏不再占位）

## 2. 桌面端快捷键固定

- [x] 2.1 在 `CategoryFilter/index.tsx` 中添加 `[` 键快捷键监听，切换 `isPinned` 状态
- [x] 2.2 当 `isPinned` 为 true 时，侧栏保持展开且不受鼠标离开影响

## 3. 设置按钮独立

- [x] 3.1 创建 `SettingsButton` 组件，桌面端 `position: fixed; left: 12px; bottom: 16px`，37x37 毛玻璃圆角方块
- [x] 3.2 从 `CategoryFilter` 中移除齿轮入口，桌面端由独立 SettingsButton 承载
- [x] 3.3 在 `Content/index.tsx` 中引入 `SettingsButton` 组件

## 4. 移动端浮动按钮与下拉菜单

- [x] 4.1 重写 `CategoryFilter/index.css` 移动端部分：隐藏侧栏（`display: none !important`）
- [x] 4.2 创建 `MobileCategoryMenu` 组件：左上角浮动按钮（40x40 毛玻璃）+ 点击弹出下拉菜单（分类列表 + 管理后台入口）
- [x] 4.3 下拉菜单交互：点击分类关闭菜单并过滤，点击遮罩关闭，点击按钮切换
- [x] 4.4 在 `Content/index.tsx` 中引入 MobileCategoryMenu（CSS media query 控制显示隐藏）

## 5. 测试与验证

- [ ] 5.1 桌面端：验证收起/展开动画流畅、1s 延迟收起、选中分类高亮保持
- [ ] 5.2 桌面端：验证快捷键固定/取消固定
- [ ] 5.3 移动端：验证浮动按钮位置（左上角）、下拉菜单弹出/关闭、分类过滤
- [ ] 5.4 验证有背景图/毛玻璃模式下的视觉效果一致
- [ ] 5.5 验证暗色模式下的视觉效果
