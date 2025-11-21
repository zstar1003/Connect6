import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  ROOMS: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all origins
app.use('/*', cors());

interface RoomInfo {
  id: string;
  hostName: string;
  createdAt: number;
  playerCount: number;
  maxPlayers: number;
}

// Get all active rooms
app.get('/rooms', async (c) => {
  const rooms = await c.env.ROOMS.list();
  const activeRooms: RoomInfo[] = [];

  for (const key of rooms.keys) {
    const room = await c.env.ROOMS.get(key.name);
    if (room) {
      const roomData = JSON.parse(room);
      // Remove rooms older than 5 minutes
      if (Date.now() - roomData.createdAt < 5 * 60 * 1000) {
        activeRooms.push(roomData);
      } else {
        // Cleanup expired room
        await c.env.ROOMS.delete(key.name);
      }
    }
  }

  return c.json(activeRooms);
});

// Create a new room
app.post('/rooms', async (c) => {
  const room: RoomInfo = await c.req.json();
  room.createdAt = Date.now();

  // Store room with 10 minute expiration
  await c.env.ROOMS.put(room.id, JSON.stringify(room), {
    expirationTtl: 600,
  });

  return c.json({ success: true, room });
});

// Delete a room
app.delete('/rooms/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.ROOMS.delete(id);
  return c.json({ success: true });
});

// Update room heartbeat
app.put('/rooms/:id/heartbeat', async (c) => {
  const id = c.req.param('id');
  const room = await c.env.ROOMS.get(id);

  if (room) {
    const roomData = JSON.parse(room);
    roomData.createdAt = Date.now();
    await c.env.ROOMS.put(id, JSON.stringify(roomData), {
      expirationTtl: 600,
    });
    return c.json({ success: true });
  }

  return c.json({ success: false }, 404);
});

export default app;