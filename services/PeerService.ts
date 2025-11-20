
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

  constructor(callbacks: PeerCallbacks) {
    this.callbacks = callbacks;
  }

  init(id?: string) {
    if (this.peer) this.peer.destroy();

    // Initialize PeerJS
    // If id is provided, we try to be that ID.
    // We rely on the default public cloud PeerServer
    this.peer = new Peer(id || '', {
        debug: 1
    });

    this.peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      this.callbacks.onOpen(id);
    });

    this.peer.on('connection', (conn) => {
      console.log('Incoming connection...');
      this.handleConnection(conn);
    });

    this.peer.on('error', (err: any) => {
      console.error('Peer error:', err);
      // Handle "Unavailable ID" specifically for hosting public rooms
      if (err.type === 'unavailable-id') {
         this.callbacks.onError('ID_TAKEN');
      } else if (err.type === 'peer-unavailable') {
         this.callbacks.onError('PEER_NOT_FOUND');
      } else {
         this.callbacks.onError(err.message || 'Unknown Error');
      }
    });
  }

  connect(remoteId: string) {
    if (!this.peer) return;
    console.log('Connecting to:', remoteId);
    const conn = this.peer.connect(remoteId);
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    if (this.conn) {
      this.conn.close();
    }
    this.conn = conn;

    this.conn.on('open', () => {
      console.log('Connected!');
      // Send initial handshake
      this.send({ type: 'connected' });
    });

    this.conn.on('data', (data) => {
      this.callbacks.onData(data);
    });

    this.conn.on('close', () => {
      console.log('Connection closed');
      this.conn = null;
      this.callbacks.onClose();
    });
    
    this.conn.on('error', (err) => {
        console.error(err);
        this.conn = null;
        this.callbacks.onClose();
    })
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
          // Create a temp peer with a random ID
          const tempPeer = new Peer('', { debug: 0 });
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
