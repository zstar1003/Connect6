# Connect-6 Master 3D

一个基于 Three.js 和 React 的 3D 六子棋游戏，支持本地双人、人机对战和在线联机对战。

[English](#english-version) | 中文

## 关于六子棋

六子棋是一种公平的策略棋类游戏：

- 黑方先手下 **1 颗**棋子
- 之后每回合双方各下 **2 颗**棋子
- 先连成 **6 颗**同色棋子者获胜（横、竖、斜均可）

## 功能特性

- ✅ **3D 棋盘** - 使用 Three.js 渲染的精美 3D 界面
- ✅ **多种游戏模式**:
  - 本地双人对战（同设备轮流）
  - 人机对战（简单/中等/困难）
  - 在线联机对战（支持局域网和互联网）
- ✅ **房间系统** - 创建和加入房间，支持自定义房间名称
- ✅ **快捷分享** - 生成房间链接，好友点击即可加入
- ✅ **音效** - 落子音效和胜利音效
- ✅ **流畅动画** - 落子动画和胜利连线高亮
- ✅ **多语言** - 支持中文、英文、日文

## 技术栈

- React 18 + TypeScript
- Three.js / React Three Fiber
- PeerJS (WebRTC)
- Vite
- Tailwind CSS
- Node.js + Express

## 快速开始

### 环境要求

- Node.js 16+ 和 npm

### 安装依赖

```bash
npm install
```

### 本地运行

#### 方式一：仅前端（本地双人/人机对战）

```bash
npm run dev
```

访问 `http://localhost:5173`

#### 方式二：完整功能（包含在线联机）

需要同时启动三个服务：

```bash
# 终端 1: 启动前端
npm run dev

# 终端 2: 启动 PeerJS 信令服务器
npm run peer

# 终端 3: 启动房间 API 服务器
npm run room
```

然后访问 `http://localhost:5173`

### 局域网联机

如果想在同一 WiFi 下的不同设备间联机：

1. 找到你的本地 IP 地址：
   - macOS/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
   - 例如: `192.168.1.100`

2. 创建 `.env.local` 文件：
   ```env
   VITE_PEER_HOST=192.168.1.100
   ```

3. 重启服务器，在其他设备上访问：
   ```
   http://192.168.1.100:5173
   ```

## 生产环境部署

详细部署文档请查看: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

推荐部署方案：
- **前端**: Cloudflare Pages（或其他静态托管）
- **后端**: 阿里云 ECS 服务器

### 构建生产版本

```bash
npm run build
```

生产文件将输出到 `dist` 目录。

## 游戏玩法

### 本地模式 / 人机对战

1. 点击"本地双人"或"人机对战"
2. 人机对战需选择难度
3. 点击棋盘下棋

### 在线联机

#### 创建房间：
1. 点击"在线大厅"
2. 输入房间名称（可选）
3. 点击"创建房间"
4. 复制房间链接分享给好友
5. 等待对手加入

#### 加入房间：
1. 点击"在线大厅"
2. 从列表中选择房间
3. 或直接访问好友分享的链接
4. 自动开始游戏

## 操作控制

- 鼠标左键: 下棋
- 鼠标右键拖动: 旋转视角
- 滚轮: 缩放
- "重置视角"按钮: 恢复默认视角

## 项目结构

```
SixRowGame/
├── components/          # React 组件
│   ├── Board.tsx       # 棋盘
│   ├── Stone.tsx       # 棋子
│   ├── Scene.tsx       # 3D 场景
│   └── Menu.tsx        # 菜单
├── services/           # 服务层
│   ├── PeerService.ts  # WebRTC 连接
│   └── RoomService.ts  # 房间管理
├── utils/              # 工具函数
│   ├── gameLogic.ts    # 游戏逻辑
│   ├── ai.ts           # AI 算法
│   └── soundManager.ts # 音效
├── i18n/               # 国际化
├── peerserver.cjs      # PeerJS 服务器
├── roomserver.cjs      # 房间 API 服务器
└── docs/               # 文档
```

## 常见问题

### 无法连接在线对战？

检查：
- PeerJS 服务器运行状态
- 房间 API 服务器运行状态
- 防火墙设置（9000、9001 端口）
- 环境变量配置

### 局域网无法连接？

确保：
- 所有设备在同一 WiFi
- `.env.local` 中 IP 地址正确
- 主机防火墙允许访问

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

## English Version

A 3D Connect-6 game built with Three.js and React, supporting local multiplayer, AI opponents, and online multiplayer.

### About Connect-6

Connect-6 is a fair strategy board game:
- Black places **1 stone** on the first turn
- After that, each player places **2 stones** per turn
- First to connect **6 stones** wins (horizontal, vertical, or diagonal)

### Features

- ✅ **3D Board** - Beautiful rendering with Three.js
- ✅ **Multiple Game Modes**: Local 1v1, AI (Easy/Medium/Hard), Online Multiplayer
- ✅ **Room System** - Create and join rooms with custom names
- ✅ **Quick Share** - Generate room links for easy joining
- ✅ **Sound Effects** - Stone placement and victory sounds
- ✅ **Smooth Animations** - Stone placement and winning line highlights
- ✅ **Multi-language** - Chinese, English, Japanese

### Quick Start

```bash
# Install dependencies
npm install

# Run all services
npm run dev  # Terminal 1: Frontend
npm run peer # Terminal 2: PeerJS server
npm run room # Terminal 3: Room API server
```

Visit `http://localhost:5173`

### Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guide.

### Controls

- Left click: Place stone
- Right drag: Rotate camera
- Mouse wheel: Zoom
- Reset View button: Reset camera

### License

MIT License
