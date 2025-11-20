
import Peer, { DataConnection } from 'peerjs';

// Define a simple interface for our callbacks
interface PeerCallbacks {
  onOpen: (id: string) => void;
  onData: (data: any) => void;
  onClose: () => void;
  onError: (err: string) => void;
}

export class PeerService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private callbacks: PeerCallbacks;
  private isInitiator: boolean = false; // Track if this peer initiated the connection

  constructor(callbacks: PeerCallbacks) {
    this.callbacks = callbacks;
  }

  init(id?: string) {
    if (this.peer) this.peer.destroy();

    // Get PeerJS server configuration from environment variables
    // Default to localhost for LAN play, fallback to public cloud server
    const useLAN = import.meta.env.VITE_USE_LAN_SERVER === 'true';
    const peerHost = import.meta.env.VITE_PEER_HOST || 'localhost';
    const peerPort = import.meta.env.VITE_PEER_PORT ? parseInt(import.meta.env.VITE_PEER_PORT) : 9000;
    const peerPath = import.meta.env.VITE_PEER_PATH || '/myapp';

    console.log('[PeerService] Config:', { useLAN, peerHost, peerPort, peerPath });

    // Initialize PeerJS
    // If id is provided, we try to be that ID.
    const peerConfig: any = {
      debug: 2, // Level 2 for important messages only (3 is too verbose)
      logFunction: function(logLevel: string, ...rest: any[]) {
        // Capture PeerJS internal logs
        const message = rest.join(' ');
        if (logLevel === 'error') {
          console.error('[PeerJS Internal]', message);
        } else if (logLevel === 'warn') {
          console.warn('[PeerJS Internal]', message);
        } else {
          console.log('[PeerJS Internal]', message);
        }
      }
    };

    // Use local PeerJS server for LAN play
    if (useLAN) {
      peerConfig.host = peerHost;
      peerConfig.port = peerPort;
      peerConfig.path = peerPath;
      peerConfig.secure = false; // Use ws:// instead of wss:// for local network

      // Add multiple STUN servers and increase timeout for better connectivity
      peerConfig.config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceTransportPolicy: 'all', // Use all available transport methods
        iceCandidatePoolSize: 10 // Pre-gather ICE candidates
      };

      // Increase connection timeout
      peerConfig.pingInterval = 5000;

      console.log(`[PeerService] Full config:`, peerConfig);
      console.log(`[PeerService] Will connect to: ws://${peerHost}:${peerPort}${peerPath}`);
    } else {
      // Use default public PeerJS cloud server
      console.log('[PeerService] Using public PeerJS cloud server');
    }

    console.log('[PeerService] Creating Peer instance...');
    this.peer = new Peer(id || '', peerConfig);
    console.log('[PeerService] Peer instance created');
    console.log('[PeerService] Registering event handlers...');

    // Add timeout detection
    const connectionTimeout = setTimeout(() => {
      console.log('[PeerService] 🔍 Timeout check: peer exists =', !!this.peer, ', peer.id =', this.peer?.id);
      if (this.peer && !this.peer.id) {
        console.error('[PeerService] ⏱️ Connection timeout! No peer ID received after 5 seconds');
        console.error('[PeerService] This usually means WebSocket connection failed');
        console.error('[PeerService] Check if ws://' + peerHost + ':' + peerPort + peerPath + ' is accessible');
      } else if (this.peer && this.peer.id) {
        console.warn('[PeerService] ⚠️ Peer ID exists but open event never fired! ID:', this.peer.id);
      }
    }, 5000);

    console.log('[PeerService] Registering "open" event handler...');
    this.peer.on('open', (id) => {
      console.log('[PeerService] 🎉 "open" event fired!');
      clearTimeout(connectionTimeout);
      console.log('[PeerService] ✓ Connected! My peer ID is: ' + id);
      this.callbacks.onOpen(id);
    });
    console.log('[PeerService] "open" handler registered, waiting for connection...');

    console.log('[PeerService] Registering "connection" event handler...');
    this.peer.on('connection', (conn) => {
      console.log('[PeerService] 🔗 "connection" event fired!');
      console.log('[PeerService] Incoming connection...');
      this.handleConnection(conn);
    });

    console.log('[PeerService] Registering "error" event handler...');
    this.peer.on('error', (err: any) => {
      console.error('[PeerService] 💥 "error" event fired!');
      console.error('[PeerService] ✕ Peer error:', err);
      console.error('[PeerService] Error type:', err.type);
      console.error('[PeerService] Error message:', err.message);

      // Handle "Unavailable ID" specifically for hosting public rooms
      if (err.type === 'unavailable-id') {
         this.callbacks.onError('ID_TAKEN');
      } else if (err.type === 'peer-unavailable') {
         this.callbacks.onError('PEER_NOT_FOUND');
      } else if (err.type === 'network') {
         console.error('[PeerService] Network error - Cannot reach PeerJS server');
         this.callbacks.onError('NETWORK_ERROR: Cannot reach PeerJS server at ' + peerHost + ':' + peerPort);
      } else if (err.type === 'server-error') {
         console.error('[PeerService] Server error - PeerJS server responded with error');
         this.callbacks.onError('SERVER_ERROR: PeerJS server error');
      } else {
         this.callbacks.onError(err.message || 'Unknown Error');
      }
    });

    console.log('[PeerService] Registering "disconnected" event handler...');
    this.peer.on('disconnected', () => {
      console.warn('[PeerService] 📴 "disconnected" event fired!');
      console.warn('[PeerService] Disconnected from PeerJS server');
    });

    console.log('[PeerService] Registering "close" event handler...');
    this.peer.on('close', () => {
      console.warn('[PeerService] 🔒 "close" event fired!');
      console.warn('[PeerService] Connection to PeerJS server closed');
    });

    console.log('[PeerService] ✅ All event handlers registered successfully');
  }

  connect(remoteId: string) {
    if (!this.peer) return;
    console.log('[PeerService] 🔗 Initiating connection to:', remoteId);
    this.isInitiator = true; // Mark as initiator
    const conn = this.peer.connect(remoteId, {
      reliable: true, // Use reliable data channel
      serialization: 'json'
    });
    console.log('[PeerService] Connection object created, waiting for "open" event...');
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    console.log('[PeerService] 📞 handleConnection called, peer:', conn.peer);
    if (this.conn) {
      console.log('[PeerService] Closing existing connection...');
      this.conn.close();
    }
    this.conn = conn;

    this.conn.on('open', () => {
      console.log('[PeerService] 🎊 Data connection "open" event fired!');
      console.log('[PeerService] Connected to peer:', this.conn?.peer);
      // Only the initiator (client) sends the 'connected' handshake
      if (this.isInitiator) {
        console.log('[PeerService] 📤 Sending connected handshake...');
        this.send({ type: 'connected' });
      }
    });

    this.conn.on('data', (data) => {
      console.log('[PeerService] 📥 Received data:', data);
      this.callbacks.onData(data);
    });

    this.conn.on('close', () => {
      console.log('[PeerService] 🔌 Data connection closed');
      this.conn = null;
      this.callbacks.onClose();
    });

    this.conn.on('error', (err) => {
        console.error('[PeerService] 💥 Data connection error:', err);
        this.conn = null;
        this.callbacks.onClose();
    })

    // Log the underlying peer connection state
    const peerConnection = (this.conn as any).peerConnection;
    if (peerConnection) {
      console.log('[PeerService] 🔍 Monitoring ICE connection state...');
      peerConnection.oniceconnectionstatechange = () => {
        console.log('[PeerService] ICE connection state:', peerConnection.iceConnectionState);
      };
      peerConnection.onicegatheringstatechange = () => {
        console.log('[PeerService] ICE gathering state:', peerConnection.iceGatheringState);
      };
      peerConnection.onsignalingstatechange = () => {
        console.log('[PeerService] Signaling state:', peerConnection.signalingState);
      };
    }
  }

  send(data: any) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  destroy() {
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.peer = null;
    this.conn = null;
  }

  // Static method to scan a room without needing a full service instance
  // This creates a temporary peer to check if another peer exists
  static async checkRoomStatus(roomId: string): Promise<'online' | 'offline'> {
      return new Promise((resolve) => {
          // Get PeerJS server configuration
          const useLAN = import.meta.env.VITE_USE_LAN_SERVER === 'true';
          const peerHost = import.meta.env.VITE_PEER_HOST || 'localhost';
          const peerPort = import.meta.env.VITE_PEER_PORT ? parseInt(import.meta.env.VITE_PEER_PORT) : 9000;
          const peerPath = import.meta.env.VITE_PEER_PATH || '/myapp';

          const peerConfig: any = { debug: 0 };

          if (useLAN) {
              peerConfig.host = peerHost;
              peerConfig.port = peerPort;
              peerConfig.path = peerPath;
              peerConfig.secure = false;
          }

          // Create a temp peer with a random ID
          const tempPeer = new Peer('', peerConfig);
          let timeout: any;

          const cleanup = () => {
              if (timeout) clearTimeout(timeout);
              tempPeer.destroy();
          };

          tempPeer.on('open', () => {
             const conn = tempPeer.connect(roomId, { reliable: true });

             // If we connect, the room is online
             conn.on('open', () => {
                 conn.close();
                 cleanup();
                 resolve('online');
             });

             // If connection errors immediately
             conn.on('error', () => {
                 // Wait for timeout or peer error
             });
          });

          tempPeer.on('error', (err: any) => {
              // Peer unavailable is the expected error for offline rooms
              cleanup();
              resolve('offline');
          });

          // Timeout after 2.5s
          timeout = setTimeout(() => {
              cleanup();
              resolve('offline'); // Assume offline if timed out
          }, 2500);
      });
  }
}
