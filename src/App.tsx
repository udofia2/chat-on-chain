import React, { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/sections/Dashboard';
import { Chat } from './components/sections/Chat';
import { Friends } from './components/sections/Friends';
import { Profile } from './components/sections/Profile';
import { WalletConnection } from './components/WalletConnection';
import { useStore } from './store/useStore';
import { useWallet } from './hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';

function App() {
  const { activeSection, setCurrentUser, currentUser } = useStore();
  const { wallet } = useWallet();

  useEffect(() => {
    if (wallet.isConnected && !currentUser) {
      // Simulate user registration/login
      setCurrentUser({
        id: '1',
        username: 'johndoe',
        ensName: 'johndoe.chainchat.eth',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
        bio: 'Web3 enthusiast and early adopter of decentralized chat!',
        walletAddress: wallet.address!,
        isOnline: true,
        lastSeen: 'now'
      });
    }
  }, [wallet.isConnected, currentUser, setCurrentUser, wallet.address]);

  const handleWalletConnected = () => {
    // This will trigger the useEffect above
  };

    if (!wallet.isConnected) {
    return (
      <AppProvider>
        <WalletConnection onConnected={handleWalletConnected} />
      </AppProvider>
    );
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <Chat />;
      case 'friends':
        return <Friends />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  if (!wallet.isConnected) {
    return <WalletConnection onConnected={handleWalletConnected} />;
  }

  return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          <Header />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {renderActiveSection()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
  );
}

export default App;