import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatWindow: React.FC = () => {
  const { activeChat, messages, addMessage, setActiveChat } = useStore();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;

    const message = {
      id: Date.now().toString(),
      senderId: '1', // Current user ID
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      status: 'sent' as const
    };

    addMessage(activeChat.id, message);
    setNewMessage('');

    // Simulate typing indicator and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate response from other participant
      const otherParticipant = activeChat.participants.find(p => p.id !== '1');
      if (otherParticipant) {
        const response = {
          id: (Date.now() + 1).toString(),
          senderId: otherParticipant.id,
          content: 'Thanks for the message! 😊',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          status: 'delivered' as const
        };
        addMessage(activeChat.id, response);
      }
    }, 2000);
  };

  const getOtherParticipant = () => {
    if (!activeChat) return null;
    if (activeChat.type === 'group') return null;
    return activeChat.participants.find(p => p.id !== '1');
  };

  const getChatName = () => {
    if (!activeChat) return '';
    if (activeChat.type === 'group') return activeChat.name;
    const otherParticipant = getOtherParticipant();
    return otherParticipant?.username || 'Unknown';
  };

  const getChatAvatar = () => {
    if (!activeChat) return '';
    if (activeChat.type === 'group') return activeChat.avatar;
    const otherParticipant = getOtherParticipant();
    return otherParticipant?.avatar || '';
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a chat to start messaging
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose from your conversations or start a new one
          </p>
        </div>
      </div>
    );
  }

  const chatMessages = messages[activeChat.id] || [];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveChat(null)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <Avatar
            src={getChatAvatar()}
            alt={getChatName()}
            size="md"
            online={activeChat.type === 'private' ? getOtherParticipant()?.isOnline : undefined}
          />
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getChatName()}
            </h3>
            {activeChat.type === 'group' ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeChat.participants.length} members
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getOtherParticipant()?.isOnline ? 'Online' : `Last seen ${getOtherParticipant()?.lastSeen}`}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Video size={20} />
          </button>
          <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        <AnimatePresence>
          {chatMessages.map((message) => {
            const isOwn = message.senderId === '1';
            const sender = activeChat.participants.find(p => p.id === message.senderId);
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs md:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && activeChat.type === 'group' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
                      {sender?.username}
                    </p>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </span>
                    {isOwn && (
                      <span className={`text-xs ${
                        message.status === 'read' ? 'text-indigo-600' : 'text-gray-400'
                      }`}>
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>
                
                {!isOwn && (
                  <div className="order-1 mr-3">
                    <Avatar
                      src={sender?.avatar || ''}
                      alt={sender?.username || ''}
                      size="sm"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Smile size={18} />
            </button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 rounded-xl"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};