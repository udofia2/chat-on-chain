import React, { useState } from 'react';
import { User, Upload, Loader2, CheckCircle, AlertCircle, Wallet, Network, LogOut, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { useEns } from '../hooks/useEns';
import { useWallet } from '../hooks/useWallet';
import { useSwitchChain, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { sepolia, mainnet } from 'wagmi/chains';

export const RegistrationLanding: React.FC = () => {
  const { wallet } = useWallet();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { 
    checkUsernameAvailability, 
    registerUsername, 
    uploadAndSetAvatar,
    getRegistrationFee,
    isLoading,
    error 
  } = useEns();

  const [step, setStep] = useState<'welcome' | 'username' | 'profile' | 'complete'>('welcome');
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar: null as File | null
  });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [registrationFee, setRegistrationFee] = useState<string>('0.01');
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);

  // Load registration fee on mount
  React.useEffect(() => {
    getRegistrationFee().then(setRegistrationFee);
  }, [getRegistrationFee]);

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const isAvailable = await checkUsernameAvailability(username);
    setUsernameStatus(isAvailable ? 'available' : 'taken');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData({ ...formData, username });
    
    // Debounce username checking
    setTimeout(() => checkUsername(username), 500);
  };

  const handleRegister = async () => {
    const success = await registerUsername(formData.username);
    if (success) {
      setStep('profile');
    }
  };

  const handleProfileComplete = async () => {
    if (formData.avatar) {
      await uploadAndSetAvatar(formData.avatar);
    }
    setStep('complete');
    
    // Redirect to main app after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 11155111: return 'Sepolia';
      case 137: return 'Polygon';
      case 10: return 'Optimism';
      case 42161: return 'Arbitrum';
      default: return 'Unknown';
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 11155111: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const isCorrectNetwork = chainId === 11155111; // Sepolia

  const WalletHeader = () => (
    <div className="absolute top-6 right-6 z-10">
      <div className="flex items-center space-x-3">
        {/* Network Indicator */}
        <div className="relative">
          <button
            onClick={() => setShowNetworkMenu(!showNetworkMenu)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${getNetworkColor(chainId)} ${!isCorrectNetwork ? 'ring-2 ring-yellow-400' : ''}`}
          >
            <Network size={16} />
            <span>{getNetworkName(chainId)}</span>
            <ChevronDown size={14} />
          </button>

          {showNetworkMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[200px] z-20"
            >
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">Switch Network:</p>
                
                <button
                  onClick={() => {
                    switchChain({ chainId: 11155111 });
                    setShowNetworkMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${chainId === 11155111 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : ''}`}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Sepolia (Recommended)</span>
                  {chainId === 11155111 && <CheckCircle size={14} />}
                </button>

                <button
                  onClick={() => {
                    switchChain({ chainId: 1 });
                    setShowNetworkMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${chainId === 1 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Ethereum Mainnet</span>
                  {chainId === 1 && <CheckCircle size={14} />}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* RainbowKit Connect Button (includes disconnect) */}
        <ConnectButton showBalance={false} />
      </div>
    </div>
  );

  const NetworkWarning = () => {
    if (isCorrectNetwork) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center space-x-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Wrong Network
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ChainChat requires Sepolia testnet. Please switch networks to continue.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => switchChain({ chainId: 11155111 })}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            Switch to Sepolia
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="text-white font-bold text-3xl">C</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to ChainChat!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              To get started, you need to register your unique username as an ENS domain. 
              This will be your identity across the decentralized web.
            </p>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                What you'll get:
              </h3>
              <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Your own .chainchat.eth domain</li>
                <li>• Decentralized profile stored on IPFS</li>
                <li>• Access to all ChainChat features</li>
                <li>• True ownership of your digital identity</li>
              </ul>
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <span>Connected: {wallet.formattedAddress}</span>
              <span>•</span>
              <span>Network: {getNetworkName(chainId)}</span>
              <span>•</span>
              <span>Fee: {registrationFee} ETH</span>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep('username')}
              disabled={!isCorrectNetwork}
              className="text-lg px-8 py-4"
            >
              Start Registration
            </Button>
          </motion.div>
        );

      case 'username':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <User className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Username
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This will become your .chainchat.eth domain
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={handleUsernameChange}
                    placeholder="johndoe"
                    disabled={!isCorrectNetwork}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {usernameStatus === 'taken' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Will create: <span className="font-mono">{formData.username}.chainchat.eth</span>
                </p>
                
                {usernameStatus === 'taken' && (
                  <p className="text-sm text-red-600 mt-2">Username is already taken</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('welcome')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRegister}
                  disabled={!isCorrectNetwork || usernameStatus !== 'available' || isLoading}
                  loading={isLoading}
                  className="flex-1"
                >
                  Register ({registrationFee} ETH)
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Your Profile
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add a profile picture and bio (optional)
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.files?.[0] || null })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                {formData.avatar && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.avatar.name} selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.bio.length}/200 characters
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleProfileComplete}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  variant="primary"
                  onClick={handleProfileComplete}
                  loading={isLoading}
                  className="flex-1"
                >
                  Complete Profile
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to ChainChat!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your profile has been created successfully.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Your ENS: {formData.username}.chainchat.eth
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to the main application...
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4 relative">
      <WalletHeader />
      
      <div className="w-full max-w-4xl">
        <NetworkWarning />
        {renderStep()}
      </div>
      
      {/* Click outside to close network menu */}
      {showNetworkMenu && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setShowNetworkMenu(false)}
        />
      )}
    </div>
  );
};