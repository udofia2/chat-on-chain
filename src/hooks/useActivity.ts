import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { chatTokenContract, eventWatcher } from '../contracts/utils/contractCalls';
import { ACTIVITY_TYPES, CHAT_TOKEN_REWARDS } from '../lib/constants';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  user: {
    address: string;
    username: string;
    avatar: string;
  };
  actionUrl?: string;
  tokenReward?: number;
  isRead: boolean;
}

interface TokenStats {
  balance: number;
  pendingRewards: number;
  totalEarned: number;
  canClaimDaily: boolean;
  lastClaimTime: Date | null;
}

interface UseActivityReturn {
  activities: ActivityItem[];
  tokenStats: TokenStats;
  isLoading: boolean;
  error: string | null;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (activityId: string) => void;
  markAllAsRead: () => void;
  claimDailyReward: () => Promise<boolean>;
  rewardActivity: (activity: string) => Promise<boolean>;
  refreshTokenStats: () => Promise<void>;
  getUnreadCount: () => number;
}

export const useActivity = (): UseActivityReturn => {
  const { address } = useAccount();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    balance: 0,
    pendingRewards: 0,
    totalEarned: 0,
    canClaimDaily: false,
    lastClaimTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load token statistics
   */
  const loadTokenStats = useCallback(async () => {
    if (!address) return;

    try {
      const [balance, pendingRewards, canClaimDaily, lastClaimTime] = await Promise.all([
        chatTokenContract.getBalance(address),
        chatTokenContract.getPendingRewards(address),
        chatTokenContract.canClaimDailyReward(address),
        chatTokenContract.getLastClaimTime(address),
      ]);

      setTokenStats({
        balance: Number(balance),
        pendingRewards: Number(pendingRewards),
        totalEarned: Number(balance) + Number(pendingRewards), // Simplified calculation
        canClaimDaily,
        lastClaimTime: Number(lastClaimTime) > 0 ? new Date(Number(lastClaimTime) * 1000) : null,
      });
    } catch (err) {
      console.error('Error loading token stats:', err);
      setError('Failed to load token statistics');
    }
  }, [address]);

  /**
   * Add new activity
   */
  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      isRead: false,
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep only last 100 activities
  }, []);

  /**
   * Mark activity as read
   */
  const markAsRead = useCallback((activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, isRead: true } : activity
    ));
  }, []);

  /**
   * Mark all activities as read
   */
  const markAllAsRead = useCallback(() => {
    setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })));
  }, []);

  /**
   * Claim daily reward
   */
  const claimDailyReward = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const canClaim = await chatTokenContract.canClaimDailyReward(address);
      if (!canClaim) {
        setError('Daily reward already claimed today');
        return false;
      }

      const txHash = await chatTokenContract.claimDailyReward();
      console.log('Daily reward claimed:', txHash);

      // Add activity
      addActivity({
        type: ACTIVITY_TYPES.TOKEN_REWARD,
        title: 'Daily Reward Claimed',
        description: `You earned ${CHAT_TOKEN_REWARDS.DAILY_LOGIN} ChatTokens for daily login`,
        user: {
          address,
          username: 'You',
          avatar: '',
        },
        tokenReward: CHAT_TOKEN_REWARDS.DAILY_LOGIN,
      });

      // Refresh token stats
      await loadTokenStats();

      return true;
    } catch (err) {
      console.error('Error claiming daily reward:', err);
      setError('Failed to claim daily reward');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, addActivity, loadTokenStats]);

  /**
   * Reward user for activity
   */
  const rewardActivity = useCallback(async (activityType: string): Promise<boolean> => {
    if (!address) return false;

    try {
      const txHash = await chatTokenContract.rewardActivity(address, activityType);
      console.log('Activity rewarded:', txHash);

      // Get reward amount based on activity type
      const rewardAmount = (CHAT_TOKEN_REWARDS as any)[activityType.toUpperCase()] || 1;

      // Add activity
      addActivity({
        type: ACTIVITY_TYPES.TOKEN_REWARD,
        title: 'Tokens Earned',
        description: `You earned ${rewardAmount} ChatTokens for ${activityType}`,
        user: {
          address,
          username: 'You',
          avatar: '',
        },
        tokenReward: rewardAmount,
      });

      // Refresh token stats
      await loadTokenStats();

      return true;
    } catch (err) {
      console.error('Error rewarding activity:', err);
      return false;
    }
  }, [address, addActivity, loadTokenStats]);

  /**
   * Refresh token statistics
   */
  const refreshTokenStats = useCallback(async () => {
    await loadTokenStats();
  }, [loadTokenStats]);

  /**
   * Get unread activity count
   */
  const getUnreadCount = useCallback((): number => {
    return activities.filter(activity => !activity.isRead).length;
  }, [activities]);

  // Load token stats when address changes
  useEffect(() => {
    if (address) {
      loadTokenStats();
    } else {
      setTokenStats({
        balance: 0,
        pendingRewards: 0,
        totalEarned: 0,
        canClaimDaily: false,
        lastClaimTime: null,
      });
      setActivities([]);
    }
  }, [address, loadTokenStats]);

  // Set up event listeners for token rewards
  useEffect(() => {
    if (!address) return;

    const unsubscribeTokenRewards = eventWatcher.watchTokenRewards((logs) => {
      logs.forEach((log: any) => {
        if (log.args.user.toLowerCase() === address.toLowerCase()) {
          addActivity({
            type: ACTIVITY_TYPES.TOKEN_REWARD,
            title: 'Tokens Rewarded',
            description: `You earned ${log.args.amount} ChatTokens for ${log.args.reason}`,
            user: {
              address,
              username: 'You',
              avatar: '',
            },
            tokenReward: Number(log.args.amount),
          });
          
          // Refresh token stats
          loadTokenStats();
        }
      });
    });

    return () => {
      unsubscribeTokenRewards?.();
    };
  }, [address, addActivity, loadTokenStats]);

  // Initialize with some sample activities (for demo purposes)
  useEffect(() => {
    if (address && activities.length === 0) {
      // Add welcome activity
      addActivity({
        type: 'welcome',
        title: 'Welcome to ChainChat!',
        description: 'Complete your profile to earn 100 ChatTokens',
        user: {
          address: 'system',
          username: 'ChainChat',
          avatar: '',
        },
        actionUrl: '/profile',
      });
    }
  }, [address, activities.length, addActivity]);

  return {
    activities,
    tokenStats,
    isLoading,
    error,
    addActivity,
    markAsRead,
    markAllAsRead,
    claimDailyReward,
    rewardActivity,
    refreshTokenStats,
    getUnreadCount,
  };
};