# 部署总结

本项目提供了两种主要的部署方式，每种方式支持不同的功能。

## 部署方式对比

| 功能 | itch.io 部署 | Cloudflare 部署 |
|------|-------------|----------------|
| 本地 1v1 对战 | ✅ 完全支持 | ✅ 完全支持 |
| AI 对战 | ✅ 完全支持 | ✅ 完全支持 |
| 在线联机 | ❌ 不支持 | ✅ 完全支持 |
| 3D 图形 | ✅ 完全支持 | ✅ 完全支持 |
| 音效 | ✅ 完全支持 | ✅ 完全支持 |
| 多语言 | ✅ 完全支持 | ✅ 完全支持 |
| 部署难度 | ⭐ 简单 | ⭐⭐⭐ 中等 |
| 成本 | 免费 | 免费 - $20/月 |

## 1. itch.io 部署（推荐：简单快速）

**适合场景**: 只需要本地和 AI 模式，不需要在线联机功能

**优点**:
- 部署超级简单，只需上传 ZIP 文件
- 完全免费
- 无需配置服务器
- 非常适合展示游戏

**限制**:
- 无法支持在线联机（因为 itch.io 使用 HTTPS，无法连接 HTTP 服务器）

**部署步骤**:
1. 运行 `npm run build`
2. 将 `dist` 文件夹打包为 ZIP
3. 上传到 itch.io
4. 完成！

**详细文档**: 查看 `docs/DEPLOY_TO_ITCH.md`

## 2. Cloudflare 部署（推荐：全功能）

**适合场景**: 需要完整的在线联机功能

### 方案 A: 仅前端部署（简单）

只部署前端到 Cloudflare Pages，功能和 itch.io 类似。

**费用**: 免费
**时间**: 5 分钟
**支持功能**: 本地 1v1 + AI 对战

### 方案 B: 完整部署（推荐）

部署完整的在线联机系统：
- **前端**: Cloudflare Pages（静态网站）
- **房间 API**: Cloudflare Workers + KV（房间列表管理）
- **信令服务器**: PeerJS 云服务（免费）或自建

**费用**:
- Cloudflare Pages: 免费
- Cloudflare Workers: 免费（每天 10 万次请求）
- PeerJS 云服务: 免费（有连接数限制）
- **总计**: $0/月（基础使用）

**时间**: 30-60 分钟

**部署步骤**:
1. 部署前端到 Cloudflare Pages
2. 创建 Cloudflare Worker 处理房间 API
3. 配置 KV 存储
4. 更新环境变量
5. 测试在线联机功能

### 方案 C: 自建 PeerJS 服务器（高级）

如果需要完全控制，可以自建 PeerJS 服务器到 Railway 或 Render。

**费用**:
- Cloudflare: 免费
- Railway/Render: $5-7/月
- **总计**: $5-7/月

**优点**: 完全控制，无连接数限制

**详细文档**: 查看 `docs/DEPLOY_TO_CLOUDFLARE.md`

## 部署建议

### 如果你是个人开发者，想快速展示游戏
→ 选择 **itch.io 部署**

### 如果你想提供完整的在线联机体验
→ 选择 **Cloudflare 方案 B**（免费 + 全功能）

### 如果你有预算，需要高可用性和无限连接
→ 选择 **Cloudflare 方案 C**（自建服务器）

## 快速开始

### itch.io 部署
```bash
# 1. 构建项目
npm run build

# 2. 打包
cd dist && zip -r ../connect6-game-itch.zip .

# 3. 上传到 itch.io
# 访问 https://itch.io/game/new 并上传 ZIP 文件
```

### Cloudflare 部署（仅前端）
```bash
# 1. 构建项目
npm run build

# 2. 登录 Cloudflare Dashboard
# 3. Pages → Create a project → Direct Upload
# 4. 上传 dist 文件夹
```

### Cloudflare 完整部署
```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 按照 docs/DEPLOY_TO_CLOUDFLARE.md 的详细步骤操作
```

## 技术说明

### 为什么 itch.io 不支持在线联机？

itch.io 使用 HTTPS 托管游戏，而我们的本地服务器使用 HTTP。浏览器的混合内容策略（Mixed Content Policy）不允许 HTTPS 页面加载 HTTP 资源，这是安全限制。

要在 itch.io 上支持在线联机，需要：
1. 将 PeerJS 服务器部署到云端（使用 HTTPS）
2. 将房间 API 部署到云端（使用 HTTPS）
3. 更新代码配置指向云端服务器

这正是 Cloudflare 完整部署方案所做的事情。

### 为什么选择 Cloudflare？

1. **免费额度大方**: 每天 10 万次请求，足够大多数个人项目
2. **全球 CDN**: 访问速度快
3. **易于部署**: 支持 Git 集成，自动构建
4. **Workers + KV**: 完美适合房间 API 的无服务器架构
5. **可扩展**: 需要时可以升级到付费计划

## 常见问题

**Q: 我应该选择哪个部署方式？**
A: 如果不需要在线联机，选择 itch.io。如果需要在线联机，选择 Cloudflare。

**Q: Cloudflare 部署会很复杂吗？**
A: 方案 A（仅前端）和 itch.io 一样简单。方案 B（完整）需要 30-60 分钟，但文档很详细。

**Q: 免费方案够用吗？**
A: 对于个人项目和小型游戏完全够用。Cloudflare 免费计划每天支持 10 万次请求。

**Q: 如何更新已部署的游戏？**
A: 重新构建，上传新的文件即可。Cloudflare 支持 Git 集成，推送代码即可自动部署。

**Q: 在线联机支持多少人同时在线？**
A: PeerJS 免费云服务有一定限制。如果需要更多连接，可以选择自建服务器（方案 C）。

## 更多帮助

- **itch.io 部署**: 查看 `docs/DEPLOY_TO_ITCH.md`
- **Cloudflare 部署**: 查看 `docs/DEPLOY_TO_CLOUDFLARE.md`
- **itch.io 技术说明**: 查看 `docs/ITCH_IO_NOTES.md`

祝你部署顺利！
