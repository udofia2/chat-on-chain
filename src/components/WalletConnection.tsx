import React, { useState } from 'react';
import { Wallet, Globe, Shield, Users, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { useWallet } from '../hooks/useWallet';
import { motion } from 'framer-motion';

interface WalletConnectionProps {
  onConnected: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnected }) => {
  const { connectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWallet();
    setTimeout(() => {
      setIsConnecting(false);
      onConnected();
    }, 1500);
  };

  const features = [
    {
      icon: Globe,
      title: 'Decentralized Identity',
      description: 'Your username as an NFT that you truly own'
    },
    {
      icon: Shield,
      title: 'End-to-End Encryption',
      description: 'Messages secured with Web3 cryptography'
    },
    {
      icon: Users,
      title: 'Global Community',
      description: 'Connect with Web3 enthusiasts worldwide'
    },
    {
      icon: Zap,
      title: 'Instant Messaging',
      description: 'Fast, reliable communication on the blockchain'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-white font-bold text-3xl">C</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">ChainChat</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            The future of messaging is here. Connect your wallet to start chatting on the decentralized web with end-to-end encryption and true data ownership.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handleConnect}
              loading={isConnecting}
              className="text-lg px-8 py-4"
            >
              <Wallet size={24} className="mr-3" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Supported wallets: MetaMask, WalletConnect, Coinbase Wallet, and more
          </p>
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Built on Ethereum</span>
            <span>•</span>
            <span>IPFS Storage</span>
            <span>•</span>
            <span>End-to-End Encrypted</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};