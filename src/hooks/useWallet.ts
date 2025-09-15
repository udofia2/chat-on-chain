import { useState, useEffect } from 'react';
import { WalletState } from '../types';

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: '0'
  });

  const connectWallet = async () => {
    // Simulate wallet connection
    setTimeout(() => {
      setWallet({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D1Fd7fA9C9ac1234',
        chainId: 1,
        balance: '1,247'
      });
    }, 1500);
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      balance: '0'
    });
  };

  return {
    wallet,
    connectWallet,
    disconnectWallet
  };
};