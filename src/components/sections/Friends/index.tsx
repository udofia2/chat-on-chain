import React, { useState } from 'react';
import { Search, UserPlus, Mail, Check, X, Users } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { motion } from 'framer-motion';

export const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'invites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { friends, friendRequests, acceptFriendRequest } = useStore();

  const tabs = [
    { id: 'all', label: 'All Friends', icon: Users },
    { id: 'requests', label: 'Requests', icon: UserPlus, badge: friendRequests.length },
    { id: 'invites', label: 'Invites', icon: Mail }
  ];

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.ensName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Friends & Connections
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your Web3 social network
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      {activeTab === 'all' && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends by username or ENS..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        {activeTab === 'all' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Friends ({filteredFriends.length})
              </h2>
              <Button variant="primary">
                <UserPlus size={18} className="mr-2" />
                Add Friend
              </Button>
            </div>

            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFriends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar
                        src={friend.avatar}
                        alt={friend.username}
                        size="md"
                        online={friend.isOnline}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {friend.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {friend.ensName}
                        </p>
                      </div>
                    </div>
                    
                    {friend.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {friend.bio}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button variant="primary" size="sm" className="flex-1">
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Profile
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No friends found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start building your network!'}
                </p>
                <div className="flex justify-center space-x-3">
                  <Button variant="primary">
                    <UserPlus size={18} className="mr-2" />
                    Add Friend
                  </Button>
                  <Button variant="outline">
                    <Mail size={18} className="mr-2" />
                    Invite Contacts
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Friend Requests
            </h2>

            {friendRequests.length > 0 ? (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar
                        src={request.from.avatar}
                        alt={request.from.username}
                        size="md"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {request.from.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {request.from.ensName}
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id)}
                      >
                        <Check size={16} className="mr-1" />
                        Accept
                      </Button>
                      <Button variant="outline" size="sm">
                        <X size={16} className="mr-1" />
                        Decline
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No pending requests
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  When someone sends you a friend request, it will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invites' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invite Friends
              </h2>
              <Button variant="primary">
                <Mail size={18} className="mr-2" />
                Invite from Contacts
              </Button>
            </div>

            <div className="text-center py-12">
              <Mail className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Invite friends to ChainChat
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Help your friends join the Web3 conversation. They'll get a custom ENS and avatar automatically!
              </p>
              <div className="max-w-md mx-auto space-y-4">
                <input
                  type="email"
                  placeholder="Enter email addresses (comma separated)"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <Button variant="primary" size="lg" className="w-full">
                  Send Invitations
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};