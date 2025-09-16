import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import socketService from '../libs/websocket/socket';
// import { socketService } from '../lib/websocket/socket';

interface ConnectionStatus {
  isConnected: boolean;
  reconnectAttempts: number;
}

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: any) => void;
  sendTyping: (roomId: string, isTyping: boolean) => void;
  updateUserStatus: (status: 'online' | 'offline' | 'away') => void;
  onNewMessage: (callback: (data: any) => void) => () => void;
  onTyping: (callback: (data: any) => void) => () => void;
  onUserStatusChange: (callback: (data: any) => void) => () => void;
  onFriendRequest: (callback: (data: any) => void) => () => void;
  onGroupInvitation: (callback: (data: any) => void) => () => void;
  authenticate: () => void;
  disconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { address } = useAccount();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0,
  });

  /**
   * Update connection status
   */
  const updateConnectionStatus = useCallback(() => {
    const status = socketService.getConnectionStatus();
    setConnectionStatus(status);
  }, []);

  /**
   * Join a room
   */
  const joinRoom = useCallback((roomId: string) => {
    socketService.joinRoom(roomId);
  }, []);

  /**
   * Leave a room
   */
  const leaveRoom = useCallback((roomId: string) => {
    socketService.leaveRoom(roomId);
  }, []);

  /**
   * Send message to a room
   */
  const sendMessage = useCallback((roomId: string, message: any) => {
    socketService.sendMessage(roomId, message);
  }, []);

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    socketService.sendTyping(roomId, isTyping);
  }, []);

  /**
   * Update user online status
   */
  const updateUserStatus = useCallback((status: 'online' | 'offline' | 'away') => {
    socketService.updateUserStatus(status);
  }, []);

  /**
   * Listen for new messages
   */
  const onNewMessage = useCallback((callback: (data: any) => void) => {
    socketService.onNewMessage(callback);
    return () => socketService.off('new_message', callback);
  }, []);

  /**
   * Listen for typing indicators
   */
  const onTyping = useCallback((callback: (data: any) => void) => {
    socketService.onTyping(callback);
    return () => socketService.off('user_typing', callback);
  }, []);

  /**
   * Listen for user status changes
   */
  const onUserStatusChange = useCallback((callback: (data: any) => void) => {
    socketService.onUserStatusChange(callback);
    return () => socketService.off('user_status_change', callback);
  }, []);

  /**
   * Listen for friend requests
   */
  const onFriendRequest = useCallback((callback: (data: any) => void) => {
    socketService.onFriendRequest(callback);
    return () => socketService.off('friend_request', callback);
  }, []);

  /**
   * Listen for group invitations
   */
  const onGroupInvitation = useCallback((callback: (data: any) => void) => {
    socketService.onGroupInvitation(callback);
    return () => socketService.off('group_invitation', callback);
  }, []);

  /**
   * Authenticate with wallet address
   */
  const authenticate = useCallback(() => {
    if (address) {
      socketService.authenticate(address);
    }
  }, [address]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setConnectionStatus({ isConnected: false, reconnectAttempts: 0 });
  }, []);

  // Set up connection listeners
  useEffect(() => {
    const handleConnect = () => {
      setConnectionStatus(prev => ({ ...prev, isConnected: true, reconnectAttempts: 0 }));
    };

    const handleDisconnect = () => {
      setConnectionStatus(prev => ({ ...prev, isConnected: false }));
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('reconnect_attempt', handleReconnectAttempt);

    // Initial status update
    updateConnectionStatus();

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, [updateConnectionStatus]);

  // Authenticate when address changes
  useEffect(() => {
    if (address && connectionStatus.isConnected) {
      authenticate();
    }
  }, [address, connectionStatus.isConnected, authenticate]);

  // Update user status to online when connected
  useEffect(() => {
    if (connectionStatus.isConnected && address) {
      updateUserStatus('online');
    }
  }, [connectionStatus.isConnected, address, updateUserStatus]);

  // Set user offline when disconnecting
  useEffect(() => {
    return () => {
      if (address) {
        updateUserStatus('offline');
      }
    };
  }, [address, updateUserStatus]);

  return {
    connectionStatus,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    updateUserStatus,
    onNewMessage,
    onTyping,
    onUserStatusChange,
    onFriendRequest,
    onGroupInvitation,
    authenticate,
    disconnect,
  };
};