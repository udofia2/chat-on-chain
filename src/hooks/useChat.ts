import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { groupsContract } from '../contracts/utils/contractCalls';
import { socketService } from '../libs/websocket/socket';
import { pinataService } from '../libs/ipfs/pinata';
import { useEns } from './useEns';
import { useFriends } from './useFriends';
import { GROUP_TYPES } from '../libs/constants';

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
  groupType?: number; // Group type from contract
  settings?: {
    isPublic: boolean;
    requireApproval: boolean;
    allowInvites: boolean;
    maxMembers: number;
  };
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
  createGroup: (name: string, description: string, groupType: number, isPublic: boolean, memberAddresses?: string[]) => Promise<boolean>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  addGroupMember: (groupId: string, memberAddress: string) => Promise<boolean>;
  removeGroupMember: (groupId: string, memberAddress: string) => Promise<boolean>;
  updateGroupInfo: (groupId: string, name: string, description: string, avatarHash?: string) => Promise<boolean>;
  updateGroupSettings: (groupId: string, settings: Partial<Chat['settings']>) => Promise<boolean>;
  updateTypingStatus: (isTyping: boolean) => void;
  markAsRead: (chatId: string) => void;
  refreshChats: () => Promise<void>;
  getOrCreatePrivateChat: (friendAddress: string) => Promise<Chat | null>;
  getPublicGroups: (offset?: number, limit?: number) => Promise<Chat[]>;
  searchGroups: (query: string, limit?: number) => Promise<Chat[]>;
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
   * Convert contract group to chat format
   */
  const groupToChat = useCallback(async (groupData: any): Promise<Chat> => {
    const members = await groupsContract.getGroupMembers(BigInt(groupData.id));
    const settings = await groupsContract.getGroupSettings(BigInt(groupData.id));
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
      isAdmin: await groupsContract.isGroupAdmin(BigInt(groupData.id), address!),
      createdAt: new Date(Number(groupData.createdAt) * 1000),
      groupType: groupData.groupType,
      settings: {
        isPublic: settings.isPublic,
        requireApproval: settings.requireApproval,
        allowInvites: settings.allowInvites,
        maxMembers: Number(settings.maxMembers),
      },
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
        try {
          const groupData = await groupsContract.getGroup(groupId);
          const chat = await groupToChat(groupData);
          chatList.push(chat);
        } catch (err) {
          console.error(`Error loading group ${groupId}:`, err);
          // Continue loading other groups
        }
      }

      // Load private chats (based on friends)
      for (const friend of friends) {
        try {
          const chat = await friendToChat(friend.address);
          if (chat) {
            chatList.push(chat);
          }
        } catch (err) {
          console.error(`Error creating chat for friend ${friend.address}:`, err);
          // Continue with other friends
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
  const createGroup = useCallback(async (
    name: string, 
    description: string, 
    groupType: number, 
    isPublic: boolean, 
    memberAddresses: string[] = []
  ): Promise<boolean> => {
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
        groupType,
        creator: address,
        createdAt: new Date().toISOString(),
      }, {
        name: `${name}-group-metadata`,
      });

      const txHash = await groupsContract.createGroup(name, description, avatarHash, groupType, isPublic);
      console.log('Group created:', txHash);

      // Wait for transaction and refresh chats
      setTimeout(async () => {
        await loadChats();
      }, 5000);

      return true;
    } catch (err) {
      console.error('Error creating group:', err);
      if (err instanceof Error) {
        if (err.message.includes('insufficient')) {
          setError('Insufficient balance for group creation fee');
        } else if (err.message.includes('invalid name')) {
          setError('Invalid group name');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create group');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadChats]);

  /**
   * Join group
   */
  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const groupIdBigInt = BigInt(groupId);
      
      // Check if already a member
      const isMember = await groupsContract.isGroupMember(groupIdBigInt, address);
      if (isMember) {
        setError('Already a member of this group');
        return false;
      }

      // For now, we'll assume someone with admin rights adds the user
      // In a full implementation, this would be a join request system
      const txHash = await groupsContract.addGroupMember(groupIdBigInt, address);
      console.log('Joined group:', txHash);

      // Refresh chats after transaction
      setTimeout(async () => {
        await loadChats();
      }, 5000);

      return true;
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadChats]);

  /**
   * Leave group
   */
  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const groupIdBigInt = BigInt(groupId);
      
      // Check if user is a member
      const isMember = await groupsContract.isGroupMember(groupIdBigInt, address);
      if (!isMember) {
        setError('Not a member of this group');
        return false;
      }

      const txHash = await groupsContract.leaveGroup(groupIdBigInt);
      console.log('Left group:', txHash);

      // Remove from local chats immediately
      setChats(prev => prev.filter(chat => chat.id !== `group-${groupId}`));
      
      // Clear active chat if it was the group we left
      if (activeChat?.id === `group-${groupId}`) {
        setActiveChat(null);
      }

      // Refresh chats after transaction
      setTimeout(async () => {
        await loadChats();
      }, 5000);

      return true;
    } catch (err) {
      console.error('Error leaving group:', err);
      if (err instanceof Error) {
        if (err.message.includes('creator cannot leave')) {
          setError('Group creator cannot leave. Transfer ownership first.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to leave group');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, activeChat, loadChats]);

  /**
   * Add group member
   */
  const addGroupMember = useCallback(async (groupId: string, memberAddress: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const groupIdBigInt = BigInt(groupId);
      
      // Check if user is admin
      const isAdmin = await groupsContract.isGroupAdmin(groupIdBigInt, address);
      if (!isAdmin) {
        setError('Only group admins can add members');
        return false;
      }

      // Check if target is already a member
      const isMember = await groupsContract.isGroupMember(groupIdBigInt, memberAddress);
      if (isMember) {
        setError('User is already a member');
        return false;
      }

      const txHash = await groupsContract.addGroupMember(groupIdBigInt, memberAddress);
      console.log('Member added to group:', txHash);

      // Refresh chats after transaction
      setTimeout(async () => {
        await loadChats();
      }, 5000);

      return true;
    } catch (err) {
      console.error('Error adding group member:', err);
      if (err instanceof Error) {
        if (err.message.includes('not admin')) {
          setError('Only group admins can add members');
        } else if (err.message.includes('group full')) {
          setError('Group has reached maximum member limit');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to add group member');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadChats]);

  /**
   * Remove group member
   */
  const removeGroupMember = useCallback(async (groupId: string, memberAddress: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const groupIdBigInt = BigInt(groupId);
      
      // Check if user is admin
      const isAdmin = await groupsContract.isGroupAdmin(groupIdBigInt, address);
      if (!isAdmin) {
        setError('Only group admins can remove members');
        return false;
      }

      const txHash = await groupsContract.removeGroupMember(groupIdBigInt, memberAddress);
      console.log('Member removed from group:', txHash);

      // Refresh chats after transaction
      setTimeout(async () => {
        await loadChats();
      }, 5000);

      return true;
    } catch (err) {
      console.error('Error removing group member:', err);
      if (err instanceof Error) {
        if (err.message.includes('not admin')) {
          setError('Only group admins can remove members');
        } else if (err.message.includes('cannot remove creator')) {
          setError('Cannot remove group creator');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to remove group member');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadChats]);

  /**
   * Update group information
   */
  const updateGroupInfo = useCallback(async (
    groupId: string, 
    name: string, 
    description: string, 
    avatarHash?: string
  ): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const groupIdBigInt = BigInt(groupId);
      
      // Check if user is admin
      const isAdmin = await groupsContract.isGroupAdmin(groupIdBigInt, address);
      if (!isAdmin) {
        setError('Only group admins can update group information');
        return false;
      }

      const txHash = await groupsContract.updateGroupInfo(
        groupIdBigInt, 
        name, 
        description, 
        avatarHash || ''
      );
      console.log('Group info updated:', txHash);

      // Update local state immediately
      setChats(prev => prev.map(chat => 
        chat.id === `group-${groupId}` 
          ? { ...chat, name, description, avatar: avatarHash ? pinataService.getGatewayUrl(avatarHash) : chat.avatar }
          : chat
      ));

      // Refresh chats after transaction
      setTimeout(async () => {
        await loadChats();
      }, 5000);

      return true;
    } catch (err) {
      console.error('Error updating group info:', err);
      setError('Failed to update group information');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadChats]);

  /**
   * Update group settings
   */
  const updateGroupSettings = useCallback(async (
    groupId: string, 
    settings: Partial<Chat['settings']>
  ): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const groupIdBigInt = BigInt(groupId);
      
      // Check if user is admin
      const isAdmin = await groupsContract.isGroupAdmin(groupIdBigInt, address);
      if (!isAdmin) {
        setError('Only group admins can update group settings');
        return false;
      }

      // Get current settings and merge with updates
      const currentSettings = await groupsContract.getGroupSettings(groupIdBigInt);
      const newSettings = {
        isPublic: settings.isPublic ?? currentSettings.isPublic,
        requireApproval: settings.requireApproval ?? currentSettings.requireApproval,
        allowInvites: settings.allowInvites ?? currentSettings.allowInvites,
        maxMembers: settings.maxMembers ?? Number(currentSettings.maxMembers),
      };

      const txHash = await groupsContract.updateGroupSettings(
        groupIdBigInt,
        newSettings.isPublic,
        newSettings.requireApproval,
        newSettings.allowInvites,
        newSettings.maxMembers
      );
      console.log('Group settings updated:', txHash);

      // Update local state immediately
      setChats(prev => prev.map(chat => 
        chat.id === `group-${groupId}` 
          ? { ...chat, settings: newSettings }
          : chat
      ));

      // Refresh chats after transaction
      setTimeout(async () => {
        await loadChats();
      }, 5000);

      return true;
    } catch (err) {
      console.error('Error updating group settings:', err);
      setError('Failed to update group settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadChats]);

  /**
   * Get public groups
   */
  const getPublicGroups = useCallback(async (offset: number = 0, limit: number = 20): Promise<Chat[]> => {
    try {
      const groups = await groupsContract.getPublicGroups(offset, limit);
      const chats: Chat[] = [];

      for (const group of groups) {
        const chat = await groupToChat(group);
        chats.push(chat);
      }

      return chats;
    } catch (err) {
      console.error('Error getting public groups:', err);
      return [];
    }
  }, [groupToChat]);

  /**
   * Search groups
   */
  const searchGroups = useCallback(async (query: string, limit: number = 10): Promise<Chat[]> => {
    try {
      const groups = await groupsContract.searchGroups(query, limit);
      const chats: Chat[] = [];

      for (const group of groups) {
        const chat = await groupToChat(group);
        chats.push(chat);
      }

      return chats;
    } catch (err) {
      console.error('Error searching groups:', err);
      return [];
    }
  }, [groupToChat]);

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
      
      // TODO: Load message history for this chat from storage/IPFS
      
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
    updateGroupInfo,
    updateGroupSettings,
    updateTypingStatus,
    markAsRead,
    refreshChats,
    getOrCreatePrivateChat,
    getPublicGroups,
    searchGroups,
  };
};