import { create } from 'zustand';
import { User, Chat, Message, FriendRequest, Activity } from '../types';

interface StoreState {
  currentUser: User | null;
  activeSection: string;
  activeChat: Chat | null;
  chats: Chat[];
  friends: User[];
  friendRequests: FriendRequest[];
  messages: { [chatId: string]: Message[] };
  activities: Activity[];
  isTyping: { [chatId: string]: string[] };
  sidebarOpen: boolean;
  setCurrentUser: (user: User | null) => void;
  setActiveSection: (section: string) => void;
  setActiveChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  addFriend: (friend: User) => void;
  addFriendRequest: (request: FriendRequest) => void;
  acceptFriendRequest: (requestId: string) => void;
  toggleSidebar: () => void;
}

// Mock data
const mockUser: User = {
  id: '1',
  username: 'johndoe',
  ensName: 'johndoe.chainchat.eth',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
  bio: 'Web3 enthusiast and early adopter',
  walletAddress: '0x742d35Cc6634C0532925a3b8D1Fd7fA9C9ac1234',
  isOnline: true,
  lastSeen: 'now'
};

const mockFriends: User[] = [
  {
    id: '2',
    username: 'alice',
    ensName: 'alice.chainchat.eth',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    bio: 'DeFi researcher',
    walletAddress: '0x234d35Cc6634C0532925a3b8D1Fd7fA9C9ac5678',
    isOnline: true,
    lastSeen: 'now'
  },
  {
    id: '3',
    username: 'bob',
    ensName: 'bob.chainchat.eth',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    bio: 'NFT collector',
    walletAddress: '0x567d35Cc6634C0532925a3b8D1Fd7fA9C9ac9012',
    isOnline: false,
    lastSeen: '5 mins ago'
  }
];

const mockChats: Chat[] = [
  {
    id: '1',
    type: 'private',
    participants: [mockUser, mockFriends[0]],
    lastMessage: {
      id: '1',
      senderId: '2',
      content: 'Hey! How are you doing?',
      timestamp: '2024-01-10T10:30:00Z',
      type: 'text',
      status: 'read'
    },
    unreadCount: 2
  },
  {
    id: '2',
    type: 'group',
    name: 'Web3 Builders',
    participants: [mockUser, ...mockFriends],
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=web3builders',
    lastMessage: {
      id: '2',
      senderId: '3',
      content: 'Anyone joining the hackathon?',
      timestamp: '2024-01-10T09:15:00Z',
      type: 'text',
      status: 'delivered'
    },
    unreadCount: 0
  }
];

const mockMessages: { [chatId: string]: Message[] } = {
  '1': [
    {
      id: '1',
      senderId: '2',
      content: 'Hey! How are you doing?',
      timestamp: '2024-01-10T10:30:00Z',
      type: 'text',
      status: 'read'
    },
    {
      id: '2',
      senderId: '1',
      content: 'Great! Just working on some DeFi protocols. You?',
      timestamp: '2024-01-10T10:32:00Z',
      type: 'text',
      status: 'read'
    },
    {
      id: '3',
      senderId: '2',
      content: 'Nice! I\'m exploring some new NFT projects',
      timestamp: '2024-01-10T10:35:00Z',
      type: 'text',
      status: 'read'
    }
  ]
};

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'message',
    user: mockFriends[0],
    description: 'alice.chainchat sent you a message',
    timestamp: '2024-01-10T10:30:00Z'
  },
  {
    id: '2',
    type: 'friend_request',
    user: mockFriends[1],
    description: 'bob.chainchat accepted your friend request',
    timestamp: '2024-01-10T09:15:00Z'
  },
  {
    id: '3',
    type: 'token_reward',
    user: mockUser,
    description: 'You earned 50 ChatTokens for daily activity',
    timestamp: '2024-01-10T08:00:00Z'
  }
];

export const useStore = create<StoreState>((set, get) => ({
  currentUser: null,
  activeSection: 'dashboard',
  activeChat: null,
  chats: mockChats,
  friends: mockFriends,
  friendRequests: [],
  messages: mockMessages,
  activities: mockActivities,
  isTyping: {},
  sidebarOpen: false,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveSection: (section) => set({ activeSection: section }),
  setActiveChat: (chat) => set({ activeChat: chat }),
  
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  
  addFriend: (friend) => set((state) => ({
    friends: [...state.friends, friend]
  })),
  
  addFriendRequest: (request) => set((state) => ({
    friendRequests: [...state.friendRequests, request]
  })),
  
  acceptFriendRequest: (requestId) => set((state) => {
    const request = state.friendRequests.find(r => r.id === requestId);
    if (request) {
      return {
        friendRequests: state.friendRequests.filter(r => r.id !== requestId),
        friends: [...state.friends, request.from]
      };
    }
    return state;
  }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}));