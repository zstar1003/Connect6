/**
 * Room API Server
 * 房间管理 HTTP API 服务器
 * 用于跨设备的房间发现和管理
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 9001;

// 启用 CORS - 移除通配符，让 Nginx 处理
// 如果没有使用 Nginx，取消下面这行的注释
// app.use(cors());

// 只启用 JSON 解析
app.use(express.json());

// 存储房间信息（内存存储，重启后丢失）
// 生产环境建议使用 Redis 或数据库
const rooms = new Map();

// 房间过期时间（5分钟）
const ROOM_EXPIRATION_TIME = 5 * 60 * 1000;

// 定期清理过期房间
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt > ROOM_EXPIRATION_TIME) {
      rooms.delete(id);
      console.log(`[Room API] Cleaned up expired room: ${id}`);
    }
  }
}, 60 * 1000); // 每分钟清理一次

// 获取所有房间列表
app.get('/rooms', (req, res) => {
  const now = Date.now();
  const activeRooms = [];

  // 过滤掉过期的房间
  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt < ROOM_EXPIRATION_TIME) {
      activeRooms.push(room);
    } else {
      rooms.delete(id);
    }
  }

  console.log(`[Room API] GET /rooms - Returning ${activeRooms.length} active rooms`);
  res.json(activeRooms);
});

// 创建新房间
app.post('/rooms', (req, res) => {
  const { id, hostName, playerCount, maxPlayers } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  const room = {
    id,
    hostName: hostName || 'Host',
    createdAt: Date.now(),
    playerCount: playerCount || 1,
    maxPlayers: maxPlayers || 2,
  };

  rooms.set(id, room);
  console.log(`[Room API] POST /rooms - Created room: ${id} (${hostName})`);
  res.json({ success: true, room });
});

// 删除房间
app.delete('/rooms/:id', (req, res) => {
  const { id } = req.params;

  if (rooms.has(id)) {
    rooms.delete(id);
    console.log(`[Room API] DELETE /rooms/${id} - Room deleted`);
    res.json({ success: true });
  } else {
    console.log(`[Room API] DELETE /rooms/${id} - Room not found`);
    res.status(404).json({ success: false, error: 'Room not found' });
  }
});

// 心跳更新（保持房间活跃）
app.put('/rooms/:id/heartbeat', (req, res) => {
  const { id } = req.params;

  if (rooms.has(id)) {
    const room = rooms.get(id);
    room.createdAt = Date.now(); // 更新时间戳
    rooms.set(id, room);
    console.log(`[Room API] PUT /rooms/${id}/heartbeat - Heartbeat received`);
    res.json({ success: true });
  } else {
    console.log(`[Room API] PUT /rooms/${id}/heartbeat - Room not found`);
    res.status(404).json({ success: false, error: 'Room not found' });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    activeRooms: rooms.size
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   Room API Server Started              ║
╠════════════════════════════════════════╣
║   Port: ${PORT}                        ║
║   Host: 0.0.0.0                        ║
║   CORS: Enabled                        ║
╠════════════════════════════════════════╣
║   Endpoints:                           ║
║   GET    /rooms                        ║
║   POST   /rooms                        ║
║   DELETE /rooms/:id                    ║
║   PUT    /rooms/:id/heartbeat          ║
║   GET    /health                       ║
╚════════════════════════════════════════╝
  `);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n[Room API] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Room API] Shutting down gracefully...');
  process.exit(0);
});
