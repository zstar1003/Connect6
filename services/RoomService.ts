/**
 * Room Service for managing game rooms via HTTP API
 * Connects to the room server for cross-device room discovery
 */

export interface RoomInfo {
  id: string;
  hostName: string;
  createdAt: number;
  playerCount: number;
  maxPlayers: number;
}

class RoomService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentRoomId: string | null = null;

  /**
   * Get the room server URL dynamically from current location
   */
  // private getServerUrl(): string {
  //   // Use the current host (automatically handles localhost vs LAN IP)
  //   const host = window.location.hostname;
  //   const port = import.meta.env.VITE_ROOM_SERVER_PORT || '9001';
  //   return `http://${host}:${port}`;
  // }
  private getServerUrl(): string {
    // 1. Priority: Use environment variable if provided
    const roomApiUrl = import.meta.env.VITE_ROOM_API_URL as string | undefined;
    if (roomApiUrl) {
      console.log('[RoomService] Using VITE_ROOM_API_URL:', roomApiUrl);
      return roomApiUrl;
    }

    const host = window.location.hostname;

    // 2. Production environment detection (Cloudflare Pages)
    if (host.includes('pages.dev') || host.includes('workers.dev')) {
      // In production, VITE_ROOM_API_URL should be set
      // This is a fallback in case environment variable is not set
      console.warn('[RoomService] ⚠️ VITE_ROOM_API_URL not set in production!');
      console.warn('[RoomService] Please set VITE_ROOM_API_URL environment variable to your Worker URL');
      console.warn('[RoomService] Example: VITE_ROOM_API_URL=https://connect6-room-api.YOUR_SUBDOMAIN.workers.dev');

      // Return a placeholder that will fail, forcing user to configure properly
      return 'https://CONFIGURE_VITE_ROOM_API_URL_IN_ENV';
    }

    // 3. Local development - use HTTP with port
    const port = (import.meta.env.VITE_ROOM_SERVER_PORT as string) || '9001';
    const localUrl = `http://${host}:${port}`;
    console.log('[RoomService] Local mode, using:', localUrl);
    return localUrl;
  }
  /**
   * Create a new room on the server
   */
  async createRoom(id: string, hostName: string = 'Host'): Promise<boolean> {
    try {
      const response = await fetch(`${this.getServerUrl()}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          hostName,
          playerCount: 1,
          maxPlayers: 2,
        }),
      });

      if (response.ok) {
        this.currentRoomId = id;
        this.startHeartbeat(id);
        console.log('[RoomService] Room created:', id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[RoomService] Error creating room:', error);
      return false;
    }
  }

  /**
   * Get all available rooms from the server
   */
  async getAllRooms(): Promise<RoomInfo[]> {
    try {
      const response = await fetch(`${this.getServerUrl()}/rooms`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('[RoomService] Error fetching rooms:', error);
      return [];
    }
  }

  /**
   * Remove a room from the server
   */
  async removeRoom(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.getServerUrl()}/rooms/${id}`, {
        method: 'DELETE',
      });

      if (this.currentRoomId === id) {
        this.stopHeartbeat();
        this.currentRoomId = null;
      }

      console.log('[RoomService] Room removed:', id);
      return response.ok;
    } catch (error) {
      console.error('[RoomService] Error removing room:', error);
      return false;
    }
  }

  /**
   * Send heartbeat to keep room alive
   */
  private async sendHeartbeat(id: string): Promise<void> {
    try {
      await fetch(`${this.getServerUrl()}/rooms/${id}/heartbeat`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('[RoomService] Heartbeat error:', error);
    }
  }

  /**
   * Start heartbeat to keep room alive
   */
  private startHeartbeat(id: string): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat(id);
    }, 30000); // Update every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clean up when component unmounts
   */
  cleanup(): void {
    this.stopHeartbeat();
    if (this.currentRoomId) {
      this.removeRoom(this.currentRoomId);
    }
  }
}

export const roomService = new RoomService();
