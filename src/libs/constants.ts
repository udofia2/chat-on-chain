// Network and Contract Constants
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  POLYGON: 137,
  OPTIMISM: 10,
} as const;

export const CONTRACT_ADDRESSES = {
  ENS: import.meta.env.VITE_ENS_CONTRACT_ADDRESS || '',
  FRIENDS: import.meta.env.VITE_FRIENDS_CONTRACT_ADDRESS || '',
  GROUPS: import.meta.env.VITE_GROUPS_CONTRACT_ADDRESS || '',
  CHAT_TOKEN: import.meta.env.VITE_CHAT_TOKEN_CONTRACT_ADDRESS || '',
} as const;

// IPFS Configuration
export const IPFS_CONFIG = {
  PINATA_JWT: import.meta.env.VITE_PINATA_JWT || '',
  PINATA_GATEWAY: import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'ChainChat',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Decentralized Web3 Chat Application',
  ENS_SUFFIX: '.chainchat.eth',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BIO_LENGTH: 140,
  DICEBEAR_API: 'https://api.dicebear.com/7.x/avataaars/svg',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

// Activity Types
export const ACTIVITY_TYPES = {
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friend_request',
  GROUP_JOIN: 'group_join',
  TOKEN_REWARD: 'token_reward',
} as const;

// Chat Token Rewards
export const CHAT_TOKEN_REWARDS = {
  DAILY_LOGIN: 10,
  SEND_MESSAGE: 1,
  CREATE_GROUP: 50,
  INVITE_FRIEND: 25,
  COMPLETE_PROFILE: 100,
} as const;