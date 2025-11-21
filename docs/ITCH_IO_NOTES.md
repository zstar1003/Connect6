## itch.io 部署注意事项

### 问题总结

在 itch.io 上部署时遇到的问题：

1. **403 错误（已修复）**:
   - 原因：Vite 默认使用绝对路径
   - 解决：在 `vite.config.ts` 中设置 `base: './'`

2. **声音文件加载失败（已修复）**:
   - 原因：资源文件需要在 `public` 文件夹中
   - 解决：确保所有资源文件在 `/public/resources/` 中

3. **在线联机功能不可用（设计限制）**:
   - 原因：itch.io 使用 HTTPS，但需要连接本地 HTTP 服务器（Mixed Content 错误）
   - 解决：在 itch.io 环境中自动隐藏在线联机选项

### 可用功能

在 itch.io 上，以下功能完全可用：
- ✅ 本地 1v1 对战
- ✅ AI 对战（所有难度）
- ✅ 3D 图形和动画
- ✅ 音效
- ✅ 多语言支持

在 itch.io 上，以下功能不可用：
- ❌ 在线联机（需要后端服务器）

### 技术说明

在线联机功能需要运行两个服务器：
1. PeerJS 服务器（WebRTC 信令，端口 9000）
2. 房间管理服务器（HTTP API，端口 9001）

这些服务器只能在本地运行，无法在 itch.io 的静态托管环境中运行。如果需要在线联机，需要：
- 部署后端服务器到云平台（如 Heroku、Railway、Fly.io）
- 使用 HTTPS 的 PeerJS 服务器
- 更新代码中的服务器地址

### 当前代码改动

1. **vite.config.ts**: 添加 `base: './'` 和构建优化
2. **utils/environment.ts**: 新增环境检测工具
3. **Menu.tsx**: 在 itch.io 环境中隐藏在线联机选项

### 重新部署步骤

1. 确保 vite.config.ts 包含正确的 base 路径
2. 运行 `npm run build`
3. 创建 ZIP: `cd dist && zip -r ../connect6-game-itch.zip .`
4. 上传到 itch.io
5. 测试本地和 AI 模式
