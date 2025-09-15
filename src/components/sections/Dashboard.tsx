import React from 'react';
import { Users, MessageSquare, Globe, Coins, TrendingUp, Clock, Star } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { currentUser, friends, activities } = useStore();

  const stats = [
    {
      title: 'Total Friends',
      value: friends.length,
      maxValue: 50,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    },
    {
      title: 'Messages Sent',
      value: 1247,
      trend: '+15%',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Platform Users',
      value: 45678,
      trend: '+8.2%',
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'ChatTokens',
      value: 1247,
      action: 'Claim Rewards',
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'friend_request': return Users;
      case 'token_reward': return Coins;
      default: return Star;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {currentUser?.username}! 👋
            </h1>
            <p className="text-indigo-100 text-lg">
              Ready to connect with your Web3 community?
            </p>
          </div>
          <div className="hidden md:flex space-x-3">
            <Button variant="secondary" size="lg">
              Create Group
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-indigo-600">
              Invite Friends
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {stat.trend && (
                  <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                    <TrendingUp size={14} />
                    <span>{stat.trend}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </span>
                  {stat.maxValue && (
                    <span className="text-sm text-gray-500">
                      /{stat.maxValue}
                    </span>
                  )}
                </div>
                
                {stat.maxValue && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${(stat.value / stat.maxValue) * 100}%` }}
                    />
                  </div>
                )}
                
                {stat.action && (
                  <Button variant="primary" size="sm" className="w-full mt-3">
                    {stat.action}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="mr-2 text-indigo-600" size={24} />
            Recent Activities
          </h2>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>

        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <motion.div
                key={activity.id}
                whileHover={{ x: 4 }}
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer"
              >
                <div className="relative">
                  <Avatar
                    src={activity.user.avatar}
                    alt={activity.user.username}
                    size="md"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-gray-800 rounded-full">
                    <Icon size={12} className="text-indigo-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </motion.div>
            );
          })}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8">
            <Clock className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={48} />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No recent activities</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Get started by adding a friend or sending a message!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};