const { PeerServer } = require('peer');
const http = require('http');
const url = require('url');

// In-memory room storage
const rooms = new Map();

// Create PeerJS server
const server = PeerServer({
  port: 9000,
  host: '0.0.0.0', // Listen on all network interfaces
  path: '/myapp',
  allow_discovery: true,
  proxied: false,
  corsOptions: {
    origin: '*',
    credentials: true
  }
});

// Create a simple HTTP server for room management on a different port
const roomServer = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // GET /rooms - List all rooms
  if (req.method === 'GET' && pathname === '/rooms') {
    const roomList = Array.from(rooms.values()).filter(room => {
      // Remove expired rooms (5 minutes)
      const isExpired = Date.now() - room.createdAt > 5 * 60 * 1000;
      if (isExpired) {
        rooms.delete(room.id);
        return false;
      }
      return true;
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(roomList));
    return;
  }

  // POST /rooms - Create a room
  if (req.method === 'POST' && pathname === '/rooms') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const room = JSON.parse(body);
        room.createdAt = Date.now();
        rooms.set(room.id, room);
        console.log(`[RoomServer] Room created: ${room.id} by ${room.hostName}`);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, room }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // DELETE /rooms/:id - Remove a room
  if (req.method === 'DELETE' && pathname.startsWith('/rooms/')) {
    const roomId = pathname.replace('/rooms/', '');
    const deleted = rooms.delete(roomId);
    console.log(`[RoomServer] Room deleted: ${roomId}, success: ${deleted}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: deleted }));
    return;
  }

  // PUT /rooms/:id/heartbeat - Update room heartbeat
  if (req.method === 'PUT' && pathname.includes('/heartbeat')) {
    const roomId = pathname.replace('/rooms/', '').replace('/heartbeat', '');
    const room = rooms.get(roomId);
    if (room) {
      room.createdAt = Date.now();
      rooms.set(roomId, room);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: !!room }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start room server on port 9001
const ROOM_SERVER_PORT = 9001;
roomServer.listen(ROOM_SERVER_PORT, '0.0.0.0', () => {
  console.log(`[RoomServer] Room management API running on port ${ROOM_SERVER_PORT}`);
});

// PeerJS server events
server.on('connection', (client) => {
  console.log(`[PeerServer] Client connected: ${client.getId()}`);
});

server.on('disconnect', (client) => {
  const clientId = client.getId();
  console.log(`[PeerServer] Client disconnected: ${clientId}`);

  // Auto-remove room when host disconnects
  if (rooms.has(clientId)) {
    rooms.delete(clientId);
    console.log(`[RoomServer] Room auto-removed on disconnect: ${clientId}`);
  }
});

console.log('');
console.log('='.repeat(50));
console.log('Connect-6 Game Server');
console.log('='.repeat(50));
console.log(`PeerJS Server:     ws://localhost:9000/myapp`);
console.log(`Room API Server:   http://localhost:${ROOM_SERVER_PORT}/rooms`);
console.log('');
console.log('For LAN play, use your local IP address instead of localhost');
console.log('Find your IP: ifconfig | grep "inet " (macOS/Linux)');
console.log('              ipconfig (Windows)');
console.log('='.repeat(50));
