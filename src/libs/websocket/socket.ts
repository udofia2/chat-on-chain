import io, { Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '../constants';

interface SocketEventData {
  [key: string]: any;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WEBSOCKET_CONFIG.URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: WEBSOCKET_CONFIG.RECONNECT_INTERVAL,
      reconnectionAttempts: WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS,
    });

    this.setupEventListeners();
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket server, attempt:', attemptNumber);
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to WebSocket server');
    });
  }

  /**
   * Join a room (for chat functionality)
   */
  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', { roomId });
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', { roomId });
    }
  }

  /**
   * Send a message
   */
  sendMessage(roomId: string, message: any) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        roomId,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(roomId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', {
        roomId,
        isTyping,
      });
    }
  }

  /**
   * Update user status (online/offline)
   */
  updateUserStatus(status: 'online' | 'offline' | 'away') {
    if (this.socket?.connected) {
      this.socket.emit('user_status', { status });
    }
  }

  /**
   * Subscribe to new messages
   */
  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  /**
   * Subscribe to user status updates
   */
  onUserStatusChange(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_status_change', callback);
    }
  }

  /**
   * Subscribe to friend requests
   */
  onFriendRequest(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('friend_request', callback);
    }
  }

  /**
   * Subscribe to group invitations
   */
  onGroupInvitation(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('group_invitation', callback);
    }
  }

  /**
   * Generic event listener
   */
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Emit custom event
   */
  emit(event: string, data: SocketEventData) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Authenticate user (send wallet address and signature)
   */
  authenticate(walletAddress: string, signature?: string) {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', {
        walletAddress,
        signature,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();
export default socketService;