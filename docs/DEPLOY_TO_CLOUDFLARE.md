# Deploy to Cloudflare Guide

This guide will walk you through deploying Connect-6 Master 3D to Cloudflare, including both the frontend and backend servers for online multiplayer.

## Architecture Overview

For full online multiplayer support, you need to deploy:
1. **Frontend**: Static website on Cloudflare Pages
2. **Backend**: PeerJS server and Room API on Cloudflare Workers (or alternative)

## Option 1: Quick Deploy (Frontend Only, No Online Multiplayer)

If you only need local and AI modes:

### Step 1: Build the Project

```bash
npm run build
```

### Step 2: Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Choose **Direct Upload**
5. Drag and drop your `dist` folder
6. Click **Save and Deploy**

Your game will be live at `https://your-project.cloudflare.pages.dev`

**Note**: Only local 1v1 and AI modes will work. Online multiplayer requires backend deployment (see Option 2).

---

## Option 2: Full Deployment (with Online Multiplayer)

For online multiplayer, you need to deploy backend services. Since Cloudflare Workers doesn't support WebSocket servers directly, we'll use alternative solutions.

### Architecture

```
Frontend (Cloudflare Pages)
    ↓
PeerJS Cloud Server (peerjs.com or self-hosted)
    ↓
Room API (Cloudflare Workers + KV)
```

### Part A: Deploy Frontend to Cloudflare Pages

#### 1. Update Configuration for Production

Create a production environment configuration:

**File: `.env.production`**
```bash
VITE_USE_LAN_SERVER=true
VITE_PEER_HOST=0.peerjs.com
VITE_PEER_PORT=443
VITE_PEER_PATH=/
VITE_ROOM_SERVER_PORT=443
```

#### 2. Update Code for Cloud PeerJS

Modify `services/PeerService.ts` to support cloud PeerJS:

```typescript
// In the init() method, update the secure setting based on production
if (useLAN) {
  peerConfig.host = peerHost;
  peerConfig.port = peerPort;
  peerConfig.path = peerPath;

  // Use secure connection in production
  peerConfig.secure = peerHost !== 'localhost' && peerHost !== '127.0.0.1';

  // For PeerJS cloud service
  if (peerHost.includes('peerjs.com')) {
    peerConfig.key = 'peerjs'; // Free tier key
  }
}
```

#### 3. Build for Production

```bash
npm run build
```

#### 4. Deploy to Cloudflare Pages

**Option A: Direct Upload**
1. Go to Cloudflare Dashboard → Pages
2. Create a project
3. Upload the `dist` folder

**Option B: Git Integration** (Recommended)
1. Push your code to GitHub/GitLab
2. Go to Cloudflare Dashboard → Pages
3. Click **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**:
     ```
     VITE_USE_LAN_SERVER=true
     VITE_PEER_HOST=0.peerjs.com
     VITE_PEER_PORT=443
     VITE_PEER_PATH=/
     ```
6. Click **Save and Deploy**

### Part B: Deploy Room API to Cloudflare Workers

The Room API manages the room list. We'll deploy it as a Cloudflare Worker with KV storage.

#### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

#### 2. Login to Cloudflare

```bash
wrangler login
```

#### 3. Create Worker Directory

```bash
mkdir cloudflare-worker
cd cloudflare-worker
npm init -y
npm install hono @cloudflare/workers-types
```

#### 4. Create Worker Code

**File: `cloudflare-worker/src/index.ts`**

```typescript
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
```

#### 5. Create Wrangler Configuration

**File: `cloudflare-worker/wrangler.toml`**

```toml
name = "connect6-room-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "ROOMS"
id = "your-kv-namespace-id"
```

#### 6. Create KV Namespace

```bash
wrangler kv namespace create ROOMS
```

Copy the `id` from the output and update `wrangler.toml`.

#### 7. Deploy Worker

```bash
wrangler deploy
```

Your Room API will be available at: `https://connect6-room-api.YOUR_SUBDOMAIN.workers.dev`

#### 8. Update Frontend Configuration

Update your environment variables to use the Worker URL:

**File: `.env.production`**
```bash
VITE_USE_LAN_SERVER=true
VITE_PEER_HOST=0.peerjs.com
VITE_PEER_PORT=443
VITE_PEER_PATH=/
```

**Update `services/RoomService.ts`:**

```typescript
private getServerUrl(): string {
  // Use environment variable or default to worker URL
  const workerUrl = import.meta.env.VITE_ROOM_API_URL;
  if (workerUrl) {
    return workerUrl;
  }

  // Fallback to dynamic URL
  const host = window.location.hostname;
  const port = import.meta.env.VITE_ROOM_SERVER_PORT || '9001';

  // In production, use the worker URL
  if (host.includes('cloudflare.pages.dev') || host.includes('workers.dev')) {
    return 'https://connect6-room-api.YOUR_SUBDOMAIN.workers.dev';
  }

  return `http://${host}:${port}`;
}
```

#### 9. Rebuild and Redeploy Frontend

```bash
npm run build
```

Upload the new `dist` folder to Cloudflare Pages, or push to Git if using Git integration.

---

## Option 3: Self-Hosted PeerJS Server (Advanced)

For full control, you can deploy your own PeerJS server:

### Deploy to Railway/Render/Fly.io

1. Create `server/package.json`:

```json
{
  "name": "connect6-peerserver",
  "version": "1.0.0",
  "main": "peerserver.cjs",
  "scripts": {
    "start": "node peerserver.cjs"
  },
  "dependencies": {
    "peer": "^1.0.0"
  }
}
```

2. Update `peerserver.cjs` to use environment variables:

```javascript
const { PeerServer } = require('peer');
const port = process.env.PORT || 9000;

const server = PeerServer({
  port: port,
  path: '/myapp',
  allow_discovery: true,
  proxied: true, // Important for deployment behind a proxy
  corsOptions: {
    origin: '*',
    credentials: true
  }
});

console.log(`PeerJS Server running on port ${port}`);
```

3. Deploy to Railway:
   - Go to [railway.app](https://railway.app)
   - Click **New Project** → **Deploy from GitHub**
   - Select your repository
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Deploy

4. Get your Railway URL (e.g., `your-app.railway.app`)

5. Update frontend environment:

```bash
VITE_PEER_HOST=your-app.railway.app
VITE_PEER_PORT=443
VITE_PEER_PATH=/myapp
```

---

## Testing Your Deployment

### Test Local Mode
1. Open your Cloudflare Pages URL
2. Click **Local 1v1**
3. Play the game on the same browser

### Test AI Mode
1. Click **Play vs Computer**
2. Select difficulty
3. Play against AI

### Test Online Multiplayer
1. Open your site in two different browsers/devices
2. First browser: Click **Online Lobby** → **Create Room**
3. Second browser: Click **Online Lobby** → Join the room
4. Play together

---

## Troubleshooting

### Issue: Online multiplayer doesn't work

**Check 1: PeerJS Connection**
- Open browser console
- Look for `[PeerService]` logs
- Verify connection to PeerJS server

**Check 2: Room API**
- Open browser console
- Look for `[RoomService]` logs
- Verify Room API requests succeed

**Check 3: CORS Issues**
- Ensure Worker has CORS enabled
- Check Network tab for CORS errors

### Issue: Rooms not appearing in list

**Solution**:
- Check KV namespace is bound correctly
- Verify Worker deployment succeeded
- Check Worker logs: `wrangler tail`

### Issue: Connection timeout

**Solution**:
- Verify PeerJS server is running
- Check firewall/network settings
- Try using PeerJS cloud service (0.peerjs.com)

---

## Cost Estimate

### Cloudflare Pages (Frontend)
- **Free tier**: 500 builds/month, unlimited bandwidth
- **Cost**: $0/month for most projects

### Cloudflare Workers (Room API)
- **Free tier**: 100,000 requests/day
- **Cost**: $0/month for moderate usage

### PeerJS Cloud (peerjs.com)
- **Free tier**: Limited concurrent connections
- **Paid**: $5-20/month for more connections

### Self-Hosted PeerJS (Railway/Render)
- **Railway**: $5/month (hobby plan)
- **Render**: $7/month (starter plan)

**Estimated total**: $0-20/month depending on your choices

---

## Production Checklist

- [ ] Frontend deployed to Cloudflare Pages
- [ ] Room API Worker deployed with KV namespace
- [ ] PeerJS server configured (cloud or self-hosted)
- [ ] Environment variables set correctly
- [ ] CORS enabled on all APIs
- [ ] Test all game modes (local, AI, online)
- [ ] Test on multiple devices/browsers
- [ ] Custom domain configured (optional)
- [ ] Analytics added (optional)

---

## Custom Domain (Optional)

### Add Custom Domain to Cloudflare Pages

1. Go to your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `connect6.yourdomain.com`)
5. Follow DNS configuration instructions
6. Wait for SSL certificate provisioning

### Add Custom Domain to Worker

1. Go to Workers & Pages
2. Select your worker
3. Click **Triggers** → **Custom Domains**
4. Add domain (e.g., `api.yourdomain.com`)
5. Update frontend to use custom API domain

---

## Next Steps

1. **Monitor Usage**: Check Cloudflare Analytics
2. **Add Features**: Leaderboards, replays, etc.
3. **Optimize Performance**: Enable Cloudflare caching
4. **Security**: Add rate limiting, authentication
5. **Monetization**: Consider premium features

---

## Support

If you encounter issues:
- Check [Cloudflare Docs](https://developers.cloudflare.com/)
- Visit [PeerJS Docs](https://peerjs.com/docs/)
- Check browser console for errors
- Review Worker logs: `wrangler tail`

Enjoy your deployed Connect-6 game!
