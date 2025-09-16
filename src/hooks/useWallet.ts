import { useAccount, useDisconnect, useBalance, useChainId } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';

export const useWallet = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balanceData: any) => {
    if (!balanceData) return '0';
    const formatted = formatEther(balanceData.value);
    return parseFloat(formatted).toFixed(4);
  };

  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  return {
    wallet: {
      isConnected,
      isConnecting,
      address: address || null,
      chainId,
      balance: formatBalance(balance),
      formattedAddress: address ? formatAddress(address) : null,
    },
    connectWallet,
    disconnectWallet,
    formatAddress,
  };
};