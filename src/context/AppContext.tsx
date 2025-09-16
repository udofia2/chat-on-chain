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

// Configure wagmi
const config = getDefaultConfig({
  appName: 'ChainChat',
  projectId: projectId || 'placeholder',
  chains: [mainnet, polygon, optimism, arbitrum, base],
    transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});


interface AppContextProps {
  children: ReactNode;
}

const AppContext = createContext<{}>({});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<AppContextProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContext.Provider value={{}}>
            {children}
          </AppContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};