import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { Avatar } from '../../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface ChatListProps {
  activeTab: 'private' | 'groups';
}

export const ChatList: React.FC<ChatListProps> = ({ activeTab }) => {
  const { chats, setActiveChat, activeChat } = useStore();

  const filteredChats = chats.filter(chat => 
    activeTab === 'private' ? chat.type === 'private' : chat.type === 'group'
  );

  const getDisplayName = (chat: any) => {
    if (chat.type === 'group') {
      return chat.name;
    }
    // For private chats, show the other participant's name
    return chat.participants.find((p: any) => p.id !== '1')?.username || 'Unknown';
  };

  const getAvatar = (chat: any) => {
    if (chat.type === 'group') {
      return chat.avatar;
    }
    return chat.participants.find((p: any) => p.id !== '1')?.avatar;
  };

  return (
    <div className="w-full md:w-80 h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeTab === 'private' ? 'Messages' : 'Groups'}
          </h2>
          <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Plus size={20} />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <motion.button
            key={chat.id}
            whileHover={{ x: 4 }}
            onClick={() => setActiveChat(chat)}
            className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all text-left ${
              activeChat?.id === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-r-4 border-indigo-600' : ''
            }`}
          >
            <div className="relative">
              <Avatar
                src={getAvatar(chat)}
                alt={getDisplayName(chat)}
                size="lg"
              />
              {chat.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chat.unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {getDisplayName(chat)}
                </h3>
                {chat.lastMessage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: false })}
                  </span>
                )}
              </div>
              
              {chat.lastMessage && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {chat.type === 'group' && (
                    <span className="font-medium">
                      {chat.participants.find(p => p.id === chat.lastMessage?.senderId)?.username}:{' '}
                    </span>
                  )}
                  {chat.lastMessage.content}
                </p>
              )}
              
              {chat.type === 'group' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {chat.participants.length} members
                </p>
              )}
            </div>
          </motion.button>
        ))}
        
        {filteredChats.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400 dark:text-gray-600 mb-3">
              {activeTab === 'private' ? '💬' : '👥'}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No {activeTab} chats yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {activeTab === 'private' 
                ? 'Start by messaging a friend!' 
                : 'Create or join a group to get started!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};