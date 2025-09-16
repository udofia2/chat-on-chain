import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { groupsContract, eventWatcher } from '../contracts/utils/contractCalls';
import { socketService } from '../lib/websocket/socket';
import { pinataService } from '../lib/ipfs/pinata';
import { useEns } from './useEns';
import { useFriends } from './useFriends';

interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  fileUrl?: string;
  fileName?: string;
  reactions?: { emoji: string; users: string[] }[];
}

interface ChatParticipant {
  address: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
}

interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isAdmin?: boolean;
  createdAt: Date;
}

interface UseChatReturn {
  chats: Chat[];
  activeChat: Chat | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: 'text') => Promise<boolean>;
  sendFileMessage: (file: File) => Promise<boolean>;
  createGroup: (name: string, description: string, memberAddresses: string[]) => Promise<boolean>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  addGroupMember: (groupId: string, memberAddress: string) => Promise<boolean>;
  removeGroupMember: (groupId: string, memberAddress: string) => Promise<boolean>;
  updateTypingStatus: (isTyping: boolean) => void;
  markAsRead: (chatId: string) => void;
  refreshChats: () => Promise<void>;
  getOrCreatePrivateChat: (friendAddress: string) => Promise<Chat | null>;
}

export const useChat = (): UseChatReturn => {
  const { address } = useAccount();
  const { getProfileByAddress } = useEns();
  const { friends } = useFriends();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  /**
   * Convert group data to chat format
   */
  const groupToChat = useCallback(async (groupData: any): Promise<Chat> => {
    const members = await groupsContract.getGroupMembers(groupData.id);
    const participants: ChatParticipant[] = [];

    for (const memberAddress of members) {
      const profile = await getProfileByAddress(memberAddress);
      if (profile) {
        participants.push({
          address: memberAddress,
          username: profile.username,
          avatar: profile.avatarUrl,
          isOnline: Math.random() > 0.5, // TODO: Real online status
          lastSeen: Math.random() > 0.7 ? 'now' : `${Math.floor(Math.random() * 60)} mins ago`,
        });
      }
    }

    return {
      id: `group-${groupData.id}`,
      type: 'group',
      name: groupData.name,
      description: groupData.description,
      avatar: groupData.avatarHash ? pinataService.getGatewayUrl(groupData.avatarHash) : undefined,
      participants,
      unreadCount: 0,
      isAdmin: groupData.admin.toLowerCase() === address?.toLowerCase(),
      createdAt: new Date(Number(groupData.createdAt) * 1000),
    };
  }, [address, getProfileByAddress]);

  /**
   * Create private chat from friend
   */
  const friendToChat = useCallback(async (friendAddress: string): Promise<Chat | null> => {
    if (!address) return null;

    const profile = await getProfileByAddress(friendAddress);
    if (!profile) return null;

    const currentUserProfile = await getProfileByAddress(address);
    if (!currentUserProfile) return null;

    return {
      id: `private-${[address, friendAddress].sort().join('-')}`,
      type: 'private',
      participants: [
        {
          address: address,
          username: currentUserProfile.username,
          avatar: currentUserProfile.avatarUrl,
          isOnline: true,
          lastSeen: 'now',
        },
        {
          address: friendAddress,
          username: profile.username,
          avatar: profile.avatarUrl,
          isOnline: Math.random() > 0.5,
          lastSeen: Math.random() > 0.7 ? 'now' : `${Math.floor(Math.random() * 60)} mins ago`,
        }
      ],
      unreadCount: 0,
      createdAt: new Date(),
    };
  }, [address, getProfileByAddress]);

  /**
   * Load all chats (groups + private)
   */
  const loadChats = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const chatList: Chat[] = [];

      // Load group chats
      const userGroups = await groupsContract.getUserGroups(address);
      for (const groupId of userGroups) {
        const groupData = await groupsContract.getGroup(groupId);
        const chat = await groupToChat(groupData);
        chatList.push(chat);
      }

      // Load private chats (based on friends)
      for (const friend of friends) {
        const chat = await friendToChat(friend.address);
        if (chat) {
          chatList.push(chat);
        }
      }

      setChats(chatList);
    } catch (err) {
      console.error('Error loading chats:', err);
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  }, [address, friends, groupToChat, friendToChat]);

  /**
   * Get or create private chat with friend
   */
  const getOrCreatePrivateChat = useCallback(async (friendAddress: string): Promise<Chat | null> => {
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.type === 'private' && 
      chat.participants.some(p => p.address.toLowerCase() === friendAddress.toLowerCase())
    );

    if (existingChat) {
      return existingChat;
    }

    // Create new private chat
    const newChat = await friendToChat(friendAddress);
    if (newChat) {
      setChats(prev => [...prev, newChat]);
    }

    return newChat;
  }, [chats, friendToChat]);

  /**
   * Send text message
   */
  const sendMessage = useCallback(async (content: string, type: 'text' = 'text'): Promise<boolean> => {
    if (!activeChat || !address) {
      setError('No active chat or wallet not connected');
      return false;
    }

    const currentUserProfile = await getProfileByAddress(address);
    if (!currentUserProfile) {
      setError('Could not load user profile');
      return false;
    }

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: address,
      senderUsername: currentUserProfile.username,
      senderAvatar: currentUserProfile.avatarUrl,
      content,
      timestamp: new Date(),
      type,
      status: 'sending',
    };

    // Add message to local state immediately
    setMessages(prev => [...prev, message]);

    try {
      // Send via WebSocket
      socketService.sendMessage(activeChat.id, {
        ...message,
        status: 'sent',
      });

      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));
      
      return false;
    }
  }, [activeChat, address, getProfileByAddress]);

  /**
   * Send file message
   */
  const sendFileMessage = useCallback(async (file: File): Promise<boolean> => {
    if (!activeChat || !address) {
      setError('No active chat or wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate file
      const validation = pinataService.validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return false;
      }

      const currentUserProfile = await getProfileByAddress(address);
      if (!currentUserProfile) {
        setError('Could not load user profile');
        return false;
      }

      // Upload file to IPFS
      const fileHash = await pinataService.uploadFile(file, {
        name: file.name,
        keyvalues: {
          type: 'chat-file',
          chatId: activeChat.id,
          sender: address,
        }
      });

      const fileUrl = pinataService.getGatewayUrl(fileHash);
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';

      // Send message with file
      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        senderId: address,
        senderUsername: currentUserProfile.username,
        senderAvatar: currentUserProfile.avatarUrl,
        content: file.name,
        timestamp: new Date(),
        type: messageType,
        status: 'sending',
        fileUrl,
        fileName: file.name,
      };

      // Add message to local state
      setMessages(prev => [...prev, message]);

      // Send via WebSocket
      socketService.sendMessage(activeChat.id, {
        ...message,
        status: 'sent',
      });

      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));

      return true;
    } catch (err) {
      console.error('Error sending file message:', err);
      setError('Failed to send file');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [activeChat, address, getProfileByAddress]);

  /**
   * Create group
   */
  const createGroup = useCallback(async (name: string, description: string, memberAddresses: string[]): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate default avatar for group
      const avatarHash = await pinataService.uploadJSON({
        name,
        type: 'group',
        members: memberAddresses.length + 1, // +1 for creator
      }, {
        name: `${name}-group-avatar`,
      });

      const txHash = await groupsContract.createGroup(name, description, avatarHash);
      console.log('Group created:', txHash);

      // Wait for transaction and refresh chats
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadChats();

      return true;
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadChats]);

  /**
   * Update typing status
   */
  const updateTypingStatus = useCallback((isTyping: boolean) => {
    if (activeChat) {
      socketService.sendTyping(activeChat.id, isTyping);
    }
  }, [activeChat]);

  /**
   * Mark chat as read
   */
  const markAsRead = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ));
  }, []);

  /**
   * Refresh chats
   */
  const refreshChats = useCallback(async () => {
    await loadChats();
  }, [loadChats]);

  // Placeholder implementations for group management
  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    // TODO: Implement group joining logic
    console.log('Join group:', groupId);
    return true;
  }, []);

  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    // TODO: Implement group leaving logic
    console.log('Leave group:', groupId);
    return true;
  }, []);

  const addGroupMember = useCallback(async (groupId: string, memberAddress: string): Promise<boolean> => {
    // TODO: Implement add member logic
    console.log('Add member:', groupId, memberAddress);
    return true;
  }, []);

  const removeGroupMember = useCallback(async (groupId: string, memberAddress: string): Promise<boolean> => {
    // TODO: Implement remove member logic
    console.log('Remove member:', groupId, memberAddress);
    return true;
  }, []);

  // Load chats when dependencies change
  useEffect(() => {
    if (address && friends.length >= 0) {
      loadChats();
    }
  }, [address, friends, loadChats]);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!address) return;

    // Join user's personal room for notifications
    socketService.authenticate(address);

    // Listen for new messages
    socketService.onNewMessage((data) => {
      if (activeChat && data.roomId === activeChat.id) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Update last message in chat list
      setChats(prev => prev.map(chat => 
        chat.id === data.roomId 
          ? { ...chat, lastMessage: data.message, unreadCount: chat.unreadCount + 1 }
          : chat
      ));
    });

    // Listen for typing indicators
    socketService.onTyping((data) => {
      if (activeChat && data.roomId === activeChat.id) {
        setTypingUsers(prev => 
          data.isTyping 
            ? [...prev.filter(user => user !== data.username), data.username]
            : prev.filter(user => user !== data.username)
        );
      }
    });

    return () => {
      socketService.off('new_message');
      socketService.off('user_typing');
    };
  }, [address, activeChat]);

  // Join/leave chat rooms when active chat changes
  useEffect(() => {
    if (activeChat) {
      socketService.joinRoom(activeChat.id);
      setMessages([]); // Clear messages when switching chats
      setTypingUsers([]);
      
      // TODO: Load message history for this chat
      
      return () => {
        socketService.leaveRoom(activeChat.id);
      };
    }
  }, [activeChat]);

  return {
    chats,
    activeChat,
    messages,
    isLoading,
    error,
    typingUsers,
    setActiveChat,
    sendMessage,
    sendFileMessage,
    createGroup,
    joinGroup,
    leaveGroup,
    addGroupMember,
    removeGroupMember,
    updateTypingStatus,
    markAsRead,
    refreshChats,
    getOrCreatePrivateChat,
  };
};