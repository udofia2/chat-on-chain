// Network and Contract Constants
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  POLYGON: 137,
  OPTIMISM: 10,
  SEPOLIA: 11155111,
} as const;

export const CONTRACT_ADDRESSES = {
  // Main Contracts
  ENS: import.meta.env.VITE_ENS_CONTRACT_ADDRESS || '0x56247d25DE41EfeA239920f43AfcfEee0dE974BB',
  FRIENDS: import.meta.env.VITE_FRIENDS_CONTRACT_ADDRESS || '0xCb908b0202DF0b64E4a7AE4A5BF8adA7EbE9cFA5',
  GROUPS: import.meta.env.VITE_GROUPS_CONTRACT_ADDRESS || '0x08A6a57eaBBA71e8618F08ec09516e7da6Cb640a',
  CHAT_TOKEN: import.meta.env.VITE_CHAT_TOKEN_CONTRACT_ADDRESS || '0x01a080B5B1Fa5e2a0Ec8061CED72E0736e05fC45',


    // Group Core Components
  GROUP_CORE: import.meta.env.VITE_GROUP_CORE_CONTRACT_ADDRESS || '0xF5498C0FE493ae5A4cfFf83ec58aD4CE6f9Cc8C3',
  GROUP_ACCESS: import.meta.env.VITE_GROUP_ACCESS_CONTRACT_ADDRESS || '0x7d8929A068B90F1eA11A5a6a6BD410fBD5f6a856',
  GROUP_QUERY: import.meta.env.VITE_GROUP_QUERY_CONTRACT_ADDRESS || '0xE9b7Ea2411Cc87F4CDbDcF0860eCB1eE872838A6',
} as const;

// IPFS Configuration
export const IPFS_CONFIG = {
  PINATA_JWT: import.meta.env.VITE_PINATA_JWT || '',
  PINATA_GATEWAY: import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
  RECONNECT_INTERVAL: Number(import.meta.env.VITE_WEBSOCKET_RECONNECT_INTERVAL) || 5000,
  MAX_RECONNECT_ATTEMPTS: Number(import.meta.env.VITE_WEBSOCKET_MAX_RECONNECT_ATTEMPTS) || 5,
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'ChainChat',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Decentralized Web3 Chat Application',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENS_SUFFIX: '.chainchat.eth',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BIO_LENGTH: 200,
  DICEBEAR_API: 'https://api.dicebear.com/7.x/avataaars/svg',
  DEFAULT_CHAIN_ID: Number(import.meta.env.VITE_DEFAULT_CHAIN_ID) || 11155111,
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
    WELCOME: 'welcome',
} as const;

// Chat Token Rewards
export const CHAT_TOKEN_REWARDS = {
  DAILY_LOGIN: 10,
  SEND_MESSAGE: 1,
  CREATE_GROUP: 50,
  INVITE_FRIEND: 25,
  COMPLETE_PROFILE: 100,
} as const;


// Group Types 
export const GROUP_TYPES = {
  PUBLIC: 0,
  PRIVATE: 1,
  COMMUNITY: 2,
  SUPPORT: 3,
  ANNOUNCEMENT: 4,
} as const;

// Contract Constants
export const CONTRACT_CONSTANTS = {
  ENS: {
    REGISTRATION_FEE: '0.01', // ETH
    MAX_USERNAME_LENGTH: 32,
    MIN_USERNAME_LENGTH: 3,
    MAX_BIO_LENGTH: 280,
  },
  GROUPS: {
    MAX_GROUP_NAME_LENGTH: 50,
    MAX_GROUP_DESCRIPTION_LENGTH: 200,
    MAX_GROUP_MEMBERS: 100,
    GROUP_CREATION_FEE: '0.001', // ETH
  },
  TOKENS: {
    DAILY_REWARD: 10,
    MESSAGE_REWARD: 1,
    GROUP_CREATION_REWARD: 50,
    FRIEND_INVITE_REWARD: 25,
    PROFILE_COMPLETION_REWARD: 100,
    MAX_DAILY_MESSAGE_REWARDS: 10,
    DAILY_CLAIM_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
} as const;

// Network RPC URLs
export const RPC_URLS = {
  [SUPPORTED_CHAINS.ETHEREUM]: `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  [SUPPORTED_CHAINS.POLYGON]: `https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  [SUPPORTED_CHAINS.OPTIMISM]: `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  // [SUPPORTED_CHAINS.ARBITRUM]: `https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  // [SUPPORTED_CHAINS.BASE]: `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  [SUPPORTED_CHAINS.SEPOLIA]: `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
} as const;

// Block Explorer URLs  
export const BLOCK_EXPLORERS = {
  [SUPPORTED_CHAINS.ETHEREUM]: 'https://etherscan.io',
  [SUPPORTED_CHAINS.POLYGON]: 'https://polygonscan.com',
  [SUPPORTED_CHAINS.OPTIMISM]: 'https://optimistic.etherscan.io',
  // [SUPPORTED_CHAINS.ARBITRUM]: 'https://arbiscan.io',
  // [SUPPORTED_CHAINS.BASE]: 'https://basescan.org',
  [SUPPORTED_CHAINS.SEPOLIA]: 'https://sepolia.etherscan.io',
} as const;