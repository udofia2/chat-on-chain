export interface User {
  id: string;
  username: string;
  ensName: string;
  avatar: string;
  bio: string;
  walletAddress: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  reactions?: { emoji: string; users: string[] }[];
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
}

export interface FriendRequest {
  id: string;
  from: User;
  to: User;
  message: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Activity {
  id: string;
  type: 'message' | 'friend_request' | 'group_join' | 'token_reward';
  user: User;
  description: string;
  timestamp: string;
  actionUrl?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
}