<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Six Row Game - 3D Connect-6

A beautiful 3D implementation of Connect-6 (六子棋) with local, AI, and online multiplayer modes.

View your app in AI Studio: https://ai.studio/apps/drive/1bU7JnVUHOdB23871hch7HDityI3pBlOT

## Features

- 🎮 **Multiple Game Modes**
  - Local play (two players on same device)
  - AI opponent
  - Online multiplayer (LAN or Internet)
- 🎨 **Beautiful 3D Graphics**
  - Realistic stone physics with drop animation
  - Smooth camera controls
  - Dynamic lighting and shadows
- 🌐 **Network Play**
  - LAN multiplayer for local network gaming
  - Public cloud server for internet play
  - Room-based matchmaking

## Run Locally

**Prerequisites:** Node.js

### 快速开始 (局域网联机)

使用自动配置脚本一键启动:

```bash
# 1. 安装依赖
npm install

# 2. 运行启动脚本 (自动检测 IP 并配置)
./start-lan.sh
```

脚本会自动:
- ✅ 检测你的本机 IP 地址
- ✅ 配置 `.env.local` 文件
- ✅ 启动 PeerJS 服务器和游戏服务器
- ✅ 显示其他设备的访问地址

📖 **详细设置指南**: 查看 [LAN_SETUP_GUIDE.md](./LAN_SETUP_GUIDE.md) 了解完整的局域网配置、故障排除和 Mac 防火墙设置。

### 手动配置

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Choose your multiplayer mode:

   ### Option A: LAN Multiplayer (Recommended for local network)

   Start both the PeerJS server and game:
   ```bash
   npm start
   ```

   This will:
   - Start the local PeerJS server on port 9000
   - Start the game development server

   **For LAN play across devices:**
   1. Find your local IP address:
      - macOS/Linux: `ifconfig | grep "inet "`
      - Windows: `ipconfig`
   2. Update `VITE_PEER_HOST` in `.env.local` with your IP (e.g., `192.168.1.100`)
   3. Other players should access the game at `http://YOUR_IP:5173`
   4. Both host and client will connect through the same PeerJS server

   ### Option B: Internet Play (Using public cloud)

   Set `VITE_USE_LAN_SERVER=false` in `.env.local`, then:
   ```bash
   npm run dev
   ```

## Configuration

Create a `.env.local` file (see `.env.example` for reference):

```bash
# API Key
GEMINI_API_KEY=your_api_key_here

# Network Mode
VITE_USE_LAN_SERVER=true  # true for LAN, false for internet

# LAN Server Settings (only used when VITE_USE_LAN_SERVER=true)
VITE_PEER_HOST=localhost   # Use your local IP for LAN play
VITE_PEER_PORT=9000
VITE_PEER_PATH=/myapp
```

## How to Play

### Local/AI Mode
- Click on the board to place stones
- Each player places one stone per turn (Connect-6 rules)
- First to connect 6 stones in a row wins

### Online Multiplayer
1. **Host a Game:**
   - Click "Host Private Room" for a random room ID
   - Or click one of the "Public Room" slots to host with a fixed ID
   - Share your Room ID with other players

2. **Join a Game:**
   - Enter the host's Room ID
   - Or scan public rooms to find available games
   - Wait for the host to start the game

## Network Architecture

- **LAN Mode:** Runs a local PeerJS server for direct peer-to-peer connections
- **Cloud Mode:** Uses PeerJS public cloud for WebRTC signaling
- All game data is transmitted peer-to-peer using WebRTC data channels

## Troubleshooting

### LAN Connection Issues
- Ensure firewall allows connections on port 9000
- Both players must use the same PeerJS server (same VITE_PEER_HOST)
- Check that `npm run peer-server` is running

### Game Performance
- Disable shadows in Scene.tsx if experiencing lag
- Reduce shadow quality by lowering `shadow-mapSize` values

## Development

Run in development mode:
```bash
npm run dev          # Game only (uses cloud server)
npm run peer-server  # PeerJS server only
npm start            # Both game and peer server
```

Build for production:
```bash
npm run build
npm run preview
```
