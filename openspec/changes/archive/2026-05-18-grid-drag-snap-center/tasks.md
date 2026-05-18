## 1. 修改吸附判定函数

- [x] 1.1 修改 `useGridLayout.ts` 中 `pixelsToGrid` 函数：将 X 和 Y 方向的 `Math.floor` 改为 `Math.round`，同时去掉 `+ margin/2` 偏移量
- [x] 1.2 确认 `useGridDrag.ts` 中 `handleDragMove` 调用 `pixelsToGrid` 时传入的参数不需要调整（当前传入的是 `translated.left` / `translated.top`，即左上角坐标，与 round 方案兼容）

## 2. 验证

- [ ] 2.1 启动开发服务器，在浏览器中手动测试：拖动 1×1 卡片到相邻位置，确认需要拖过中点才会切换
- [ ] 2.2 手动测试：拖动大尺寸文件夹（2×2 或 2×3），确认吸附判定符合视觉直觉
- [x] 2.3 运行 `cd ui && pnpm test`，确认现有测试全部通过
- [ ] 2.4 检查不同屏幕宽度（桌面 12 列、平板 8 列、手机 3 列）下拖拽行为是否正常
