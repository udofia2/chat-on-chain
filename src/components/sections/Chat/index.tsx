import React, { useState } from 'react';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';

export const Chat: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'private' | 'groups'>('private');

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setActiveTab('private')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'private'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Private Messages
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'groups'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Groups
        </button>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex">
        <ChatList activeTab={activeTab} />
        <ChatWindow />
      </div>
    </div>
  );
};