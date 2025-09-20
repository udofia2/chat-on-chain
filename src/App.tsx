import React, { useEffect, useState } from 'react';
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
import { useEns } from './hooks/useEns';
import { RegistrationLanding } from './components/RegistrationLanding';


function AppContent() {
  const { activeSection, setCurrentUser, currentUser } = useStore();
  const { wallet } = useWallet();
  const { profile, isLoading } = useEns();
  const [isInitialized, setIsInitialized] = useState(false);

  
  // Prevent hydration issues by only updating state after component mounts
  useEffect(() => {setIsInitialized(true)}, [])

  // Set current user from ENS profile after initialization
  useEffect(() => {
    if (isInitialized && wallet.isConnected && profile?.isRegistered && !currentUser) {
      // Simulate user registration/login
      setCurrentUser({
        id: wallet.address! || '1',
        username: profile?.username || 'johndoe',
        ensName: profile?.ensName || 'johndoe.chainchat.eth',
        avatar: profile?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
        bio: profile?.bio || 'Web3 enthusiast and early adopter of decentralized chat!',
        walletAddress: wallet.address!,
        isOnline: true,
        lastSeen: 'now'
      });
    }
  }, [isInitialized, wallet.isConnected, profile, currentUser, setCurrentUser, wallet.address]);


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



  // Show loading during initialization to prevent hydration mismatch
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing ChainChat...</p>
        </div>
      </div>
    );
  }

    if (!wallet.isConnected) {
    return (
      <AppProvider>
        <WalletConnection onConnected={() => {}} />
      </AppProvider>
    );
  }

    // Show loading while checking registration status
  if (isLoading) {
    return (
      <AppProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
          </div>
        </div>
      </AppProvider>
    );
  }

  // Show registration if wallet connected but user not registered
  if (wallet.isConnected && !profile?.isRegistered) {
    return (
      <AppProvider>
        <RegistrationLanding />
      </AppProvider>
    );
  }

    // Show registration if wallet connected but user not registered
  if (wallet.isConnected && !profile?.isRegistered) {
    return <RegistrationLanding />;
  }

  // Show main app if wallet connected and user registered
  return (
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
  );
}


function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;