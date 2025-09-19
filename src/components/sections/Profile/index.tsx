import React, { useState } from 'react';
import { Camera, Edit3, Save, Copy, ExternalLink, Shield, Download } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { motion } from 'framer-motion';

export const Profile: React.FC = () => {
  const { currentUser, setCurrentUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    avatar: currentUser?.avatar || ''
  });

  const handleSave = () => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        username: formData.username,
        bio: formData.bio,
        avatar: formData.avatar,
        ensName: `${formData.username}.chainchat.eth`
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: currentUser?.username || '',
      bio: currentUser?.bio || '',
      avatar: currentUser?.avatar || ''
    });
    setIsEditing(false);
  };

  const generateNewAvatar = () => {
    const newSeed = formData.username + Date.now();
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`;
    setFormData({ ...formData, avatar: newAvatar });
  };

  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your Web3 identity and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar
                  src={isEditing ? formData.avatar : currentUser.avatar}
                  alt={currentUser.username}
                  size="xl"
                  className="w-24 h-24"
                />
                {isEditing && (
                  <button
                    onClick={generateNewAvatar}
                    className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {isEditing ? formData.username : currentUser.username}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {isEditing ? `${formData.username}.chainchat.eth` : currentUser.ensName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isEditing ? formData.bio : currentUser.bio}
              </p>

              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h3>
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={16} className="mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    <Save size={16} className="mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={isEditing ? formData.username : currentUser.username}
                  onChange={(e) => isEditing && setFormData({ ...formData, username: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ENS Name
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={isEditing ? `${formData.username}.chainchat.eth` : currentUser.ensName}
                    disabled
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white opacity-50"
                  />
                  <Button variant="ghost" size="sm">
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={isEditing ? formData.bio : currentUser.bio}
                  onChange={(e) => isEditing && setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isEditing ? formData.bio.length : currentUser.bio.length}/140 characters
                </p>
              </div>
            </div>
          </motion.div>

          {/* Wallet Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Shield className="mr-2 text-indigo-600" size={20} />
              Wallet & Security
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={currentUser.walletAddress}
                    disabled
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white opacity-50 font-mono text-sm"
                  />
                  <Button variant="ghost" size="sm">
                    <Copy size={16} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Network
                </label>
                <select className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all">
                  <option>Ethereum Mainnet</option>
                  <option>Polygon</option>
                  <option>Optimism</option>
                  <option>sepolia</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Privacy Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Privacy & Data
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Public Profile</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to find your profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Message Requests</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow messages from non-friends</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" className="w-full">
                  <Download size={16} className="mr-2" />
                  Export My Data
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};