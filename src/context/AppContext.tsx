import React, { createContext, useContext, ReactNode } from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
    },
  },
});

// Get the project ID from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('VITE_WALLET_CONNECT_PROJECT_ID is not set');
}

// Configure chains based on environment
const isProduction = import.meta.env.PROD;
const defaultChainId = Number(import.meta.env.VITE_DEFAULT_CHAIN_ID) || 11155111;

// Configure wagmi with proper chain setup
const config = getDefaultConfig({
  appName: 'ChainChat',
  projectId: projectId || 'placeholder',
  chains: isProduction 
    ? [mainnet, polygon, optimism, arbitrum, base]
    : [sepolia, mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});

interface AppContextValue {
  defaultChainId: number;
  isProduction: boolean;
  contractAddresses: {
    ens: string;
    friends: string;
    groups: string;
    chatToken: string;
    groupCore: string;
    groupAccess: string;
    groupQuery: string;
  };
}

interface AppContextProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextValue>({
  defaultChainId: 11155111,
  isProduction: false,
  contractAddresses: {
    ens: '',
    friends: '',
    groups: '',
    chatToken: '',
    groupCore: '',
    groupAccess: '',
    groupQuery: '',
  },
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<AppContextProps> = ({ children }) => {
  const contextValue: AppContextValue = {
    defaultChainId,
    isProduction,
    contractAddresses: {
      ens: import.meta.env.VITE_ENS_CONTRACT_ADDRESS || '',
      friends: import.meta.env.VITE_FRIENDS_CONTRACT_ADDRESS || '',
      groups: import.meta.env.VITE_GROUPS_CONTRACT_ADDRESS || '',
      chatToken: import.meta.env.VITE_CHAT_TOKEN_CONTRACT_ADDRESS || '',
      groupCore: import.meta.env.VITE_GROUP_CORE_CONTRACT_ADDRESS || '',
      groupAccess: import.meta.env.VITE_GROUP_ACCESS_CONTRACT_ADDRESS || '',
      groupQuery: import.meta.env.VITE_GROUP_QUERY_CONTRACT_ADDRESS || '',
    },
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          initialChain={defaultChainId}
        >
          <AppContext.Provider value={contextValue}>
            {children}
          </AppContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};