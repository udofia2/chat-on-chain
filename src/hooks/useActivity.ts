import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { chatTokenContract, eventWatcher } from '../contracts/utils/contractCalls';
import { ACTIVITY_TYPES, CHAT_TOKEN_REWARDS } from '../libs/constants';
import { formatEther } from 'viem';

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
  balance: string; // In ETH format (e.g., "10.5")
  pendingRewards: string;
  totalEarned: string;
  canClaimDaily: boolean;
  lastClaimTime: Date | null;
  timeUntilNextClaim: number; // seconds
  rewardMultiplier: number; // e.g., 150 = 1.5x multiplier
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
  claimPendingRewards: () => Promise<boolean>;
  refreshTokenStats: () => Promise<void>;
  getUnreadCount: () => number;
  burnTokens: (amount: string) => Promise<boolean>;
  getActivityReward: (activity: string) => Promise<string>;
}

export const useActivity = (): UseActivityReturn => {
  const { address } = useAccount();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    balance: '0',
    pendingRewards: '0',
    totalEarned: '0',
    canClaimDaily: false,
    lastClaimTime: null,
    timeUntilNextClaim: 0,
    rewardMultiplier: 100,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load token statistics from contract
   */
  const loadTokenStats = useCallback(async () => {
    if (!address) return;

    try {
      const [
        balance,
        pendingRewards,
        totalEarned,
        canClaimDaily,
        lastClaimTime,
        timeUntilNextClaim,
        rewardMultiplier
      ] = await Promise.all([
        chatTokenContract.getBalance(address),
        chatTokenContract.getPendingRewards(address),
        chatTokenContract.getTotalEarned(address),
        chatTokenContract.canClaimDailyReward(address),
        chatTokenContract.getLastClaimTime(address),
        chatTokenContract.getTimeUntilNextClaim(address),
        chatTokenContract.getRewardMultiplier(address),
      ]);

      setTokenStats({
        balance: formatEther(balance),
        pendingRewards: formatEther(pendingRewards),
        totalEarned: formatEther(totalEarned),
        canClaimDaily,
        lastClaimTime: Number(lastClaimTime) > 0 ? new Date(Number(lastClaimTime) * 1000) : null,
        timeUntilNextClaim: Number(timeUntilNextClaim),
        rewardMultiplier: Number(rewardMultiplier),
      });
    } catch (err) {
      console.error('Error loading token stats:', err);
      setError('Failed to load token statistics');
    }
  }, [address]);

  /**
   * Add new activity to local state
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

      // Add activity immediately for better UX
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

      // Refresh token stats after a delay
      setTimeout(() => loadTokenStats(), 3000);

      return true;
    } catch (err) {
      console.error('Error claiming daily reward:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('already claimed')) {
          setError('Daily reward already claimed today');
        } else if (err.message.includes('not registered')) {
          setError('User not registered');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to claim daily reward');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, addActivity, loadTokenStats]);

  /**
   * Claim pending rewards
   */
  const claimPendingRewards = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pendingAmount = await chatTokenContract.getPendingRewards(address);
      
      if (Number(formatEther(pendingAmount)) === 0) {
        setError('No pending rewards to claim');
        return false;
      }

      const txHash = await chatTokenContract.claimPendingRewards();
      console.log('Pending rewards claimed:', txHash);

      // Add activity
      addActivity({
        type: ACTIVITY_TYPES.TOKEN_REWARD,
        title: 'Pending Rewards Claimed',
        description: `You claimed ${formatEther(pendingAmount)} ChatTokens`,
        user: {
          address,
          username: 'You',
          avatar: '',
        },
        tokenReward: Number(formatEther(pendingAmount)),
      });

      // Refresh token stats after a delay
      setTimeout(() => loadTokenStats(), 3000);

      return true;
    } catch (err) {
      console.error('Error claiming pending rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim pending rewards');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, addActivity, loadTokenStats]);

  /**
   * Burn tokens
   */
  const burnTokens = useCallback(async (amount: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const balance = await chatTokenContract.getBalance(address);
      const amountWei = BigInt(parseFloat(amount) * 10**18); // Convert to wei
      
      if (amountWei > balance) {
        setError('Insufficient balance');
        return false;
      }

      const txHash = await chatTokenContract.burn(amountWei);
      console.log('Tokens burned:', txHash);

      // Add activity
      addActivity({
        type: 'token_burn',
        title: 'Tokens Burned',
        description: `You burned ${amount} ChatTokens`,
        user: {
          address,
          username: 'You',
          avatar: '',
        },
      });

      // Refresh token stats after a delay
      setTimeout(() => loadTokenStats(), 3000);

      return true;
    } catch (err) {
      console.error('Error burning tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to burn tokens');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, addActivity, loadTokenStats]);

  /**
   * Get reward amount for an activity
   */
  const getActivityReward = useCallback(async (activity: string): Promise<string> => {
    try {
      const reward = await chatTokenContract.getActivityReward(activity);
      return formatEther(reward);
    } catch (err) {
      console.error('Error getting activity reward:', err);
      return '0';
    }
  }, []);

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
        balance: '0',
        pendingRewards: '0',
        totalEarned: '0',
        canClaimDaily: false,
        lastClaimTime: null,
        timeUntilNextClaim: 0,
        rewardMultiplier: 100,
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
          const rewardAmount = formatEther(log.args.amount);
          
          addActivity({
            type: ACTIVITY_TYPES.TOKEN_REWARD,
            title: 'Tokens Rewarded',
            description: `You earned ${rewardAmount} ChatTokens for ${log.args.reason}`,
            user: {
              address,
              username: 'You',
              avatar: '',
            },
            tokenReward: Number(rewardAmount),
          });
          
          // Refresh token stats
          setTimeout(() => loadTokenStats(), 1000);
        }
      });
    });

    const unsubscribeDailyRewards = eventWatcher.watchDailyRewardClaimed((logs) => {
      logs.forEach((log: any) => {
        if (log.args.user.toLowerCase() === address.toLowerCase()) {
          const rewardAmount = formatEther(log.args.amount);
          
          addActivity({
            type: ACTIVITY_TYPES.TOKEN_REWARD,
            title: 'Daily Reward Claimed',
            description: `You earned ${rewardAmount} ChatTokens for daily login`,
            user: {
              address,
              username: 'You',
              avatar: '',
            },
            tokenReward: Number(rewardAmount),
          });
          
          // Refresh token stats
          setTimeout(() => loadTokenStats(), 1000);
        }
      });
    });

    return () => {
      unsubscribeTokenRewards?.();
      unsubscribeDailyRewards?.();
    };
  }, [address, addActivity, loadTokenStats]);

  // Initialize with welcome activity for new users
  useEffect(() => {
    if (address && activities.length === 0) {
      // Add welcome activity
      addActivity({
        type: 'welcome',
        title: 'Welcome to ChainChat!',
        description: 'Register your username and start earning ChatTokens',
        user: {
          address: 'system',
          username: 'ChainChat',
          avatar: '',
        },
        actionUrl: '/profile',
      });
    }
  }, [address, activities.length, addActivity]);

  // Auto-refresh token stats every 30 seconds
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      loadTokenStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [address, loadTokenStats]);

  return {
    activities,
    tokenStats,
    isLoading,
    error,
    addActivity,
    markAsRead,
    markAllAsRead,
    claimDailyReward,
    claimPendingRewards,
    refreshTokenStats,
    getUnreadCount,
    burnTokens,
    getActivityReward,
  };
};