const { PeerServer } = require('peer');

const server = PeerServer({
  port: 9000,
  path: '/myapp',
  allow_discovery: true,
  proxied: false,
  // Enable CORS for local network access
  corsOptions: {
    origin: '*',
    credentials: true
  }
});

server.on('connection', (client) => {
  console.log(`[PeerServer] Client connected: ${client.getId()}`);
});

server.on('disconnect', (client) => {
  console.log(`[PeerServer] Client disconnected: ${client.getId()}`);
});

console.log('PeerJS Server is running on port 9000');
console.log('Path: /myapp');
console.log('For local network play, use: ws://<your-local-ip>:9000/myapp');
console.log('\nTo find your local IP:');
console.log('  macOS/Linux: ifconfig | grep "inet "');
console.log('  Windows: ipconfig');
