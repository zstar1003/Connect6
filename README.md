# Connect-6

A 3D Connect-6 game that supports local two-player, player-versus-AI, and online multiplayer modes.

[中文](README_ZH.md)

[![I made a 3D Six-in-a-Row](https://i0.hdslb.com/bfs/archive/ff685f17a99075e7c9d821dd2fa53d6fc524dca1.jpg@672w_378h_1c.avif)](https://www.bilibili.com/video/BV17vUKBeEKx)

Demo Links:

- Single Player: https://zstar1003.itch.io/connect-6-master-3d

- Single Player + Multiplayer: https://connect6.pages.dev

## About Six-in-a-Row

Six-in-a-Row is a fair strategy board game:

- Black moves first, placing **1** piece.

- Each subsequent turn, both players place **2** pieces.

- The first player to connect **6** pieces of the same color wins (horizontally, vertically, or diagonally).

## Features

- ✅ **3D Chessboard** - Beautiful 3D interface rendered using Three.js

- ✅ **Multiple Game Modes**:

- Local Two-Player Battle (Same Device, Alternate Turns)

- Player vs. AI Battle (Easy/Medium/Hard)

- Online Multiplayer Battle (Supports LAN and Internet)

- ✅ **Room System** - Create and join rooms, supports custom room names

- ✅ **Quick Sharing** - Generate room links, friends can join with a click

- ✅ **Sound Effects** - Placement sound effects and victory sound effects

- ✅ **Smooth Animations** - Placement animations and victory line highlighting

- ✅ **Multi-Language** - Supports Chinese, English, and Japanese

## Technology Stack

- React 18 + TypeScript

- Three.js / React Three Fiber

- PeerJS (WebRTC)

- Vite

- Tailwind CSS

- Node.js + Express

## Quick Start

### Environment Requirements

- Node.js 16+ and npm

### Install Dependencies

```bash
npm install
```

### Local Operation

#### Method 1: Frontend Only (Local Two-Player/Man vs. AI)

```bash
npm run dev
```
Access `http://localhost:5173`

#### Method 2: Full Functionality (Including Online Multiplayer)

Requires three services to be running simultaneously:

```bash

# Terminal 1: Start the frontend
npm run dev

# Terminal 2: Start the PeerJS signaling server
npm run peer

# Terminal 3: Start the room API server
npm run room
```

Then access `http://localhost:5173`

### LAN Multiplayer

To play between different devices on the same Wi-Fi network:

1. Find your local IP address:

- macOS/Linux: `ifconfig | grep "inet "`

- Windows: `ipconfig`

- For example: `192.168.1.100`

2. Create a `.env.local` file:

``env

VITE_PEER_HOST=192.168.1.100

```

3. Restart the server and access it from other devices:

```

http://192.168.1.100:5173

```

## Production Environment Deployment

For detailed deployment documentation, please see: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Recommended Deployment Solution:

- **Frontend**: Cloudflare Pages (or other static hosting)

- **Backend**: Alibaba Cloud ECS Server

### Building the Production Version

```bash
npm run build

```
The production files will be output to the `dist` directory.

## Gameplay

### Local Mode / Player vs. AI

1. Click "Local Two" or "Player vs. AI"

2. Select difficulty for Player vs. AI.

3. Click the board to play.

### Online Multiplayer

#### Creating a Room:

1. Click "Online Lobby"

2. Enter a room name (optional)

3. Click "Create Room"

4. Copy the room link and share it with friends.

5. Wait for your opponent to join.

#### Joining a Room:

1. Click "Online Lobby"

2. Select a room from the list.

3. Or directly access a link shared by a friend.

4. Game starts automatically.

## Controls

- Left Mouse Button: Move a piece

- Right Mouse Button Drag: Rotate the view

- Scroll Wheel: Zoom

- "Reset View" Button: Restore default view