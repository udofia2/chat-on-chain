import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { friendsContract, eventWatcher } from '../contracts/utils/contractCalls';
import { useEns } from './useEns';

interface FriendProfile {
  address: string;
  username: string;
  ensName: string;
  avatar: string;
  bio: string;
  isOnline: boolean;
  lastSeen: string;
}

interface FriendRequestData {
  id: string;
  from: FriendProfile;
  to: FriendProfile;
  message: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined';
}

interface UseFriendsReturn {
  friends: FriendProfile[];
  friendRequests: FriendRequestData[];
  isLoading: boolean;
  error: string | null;
  sendFriendRequest: (friendAddress: string, message: string) => Promise<boolean>;
  acceptFriendRequest: (requesterAddress: string) => Promise<boolean>;
  declineFriendRequest: (requesterAddress: string) => Promise<boolean>;
  removeFriend: (friendAddress: string) => Promise<boolean>;
  getFriendCount: () => Promise<number>;
  checkFriendship: (address: string) => Promise<boolean>;
  searchFriendByUsername: (username: string) => Promise<FriendProfile | null>;
  refreshFriends: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  getFriendSuggestions: (limit?: number) => Promise<FriendProfile[]>;
}

export const useFriends = (): UseFriendsReturn => {
  const { address } = useAccount();
  const { getProfileByAddress, getAddressByUsername } = useEns();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert address to friend profile
   */
  const addressToFriendProfile = useCallback(async (friendAddress: string): Promise<FriendProfile | null> => {
    try {
      const profile = await getProfileByAddress(friendAddress);
      if (!profile) return null;

      return {
        address: friendAddress,
        username: profile.username,
        ensName: profile.ensName,
        avatar: profile.avatarUrl,
        bio: profile.bio,
        isOnline: Math.random() > 0.5, // TODO: Implement real online status
        lastSeen: Math.random() > 0.7 ? 'now' : `${Math.floor(Math.random() * 60)} mins ago`,
      };
    } catch (err) {
      console.error('Error converting address to profile:', err);
      return null;
    }
  }, [getProfileByAddress]);

  /**
   * Load friends list
   */
  const loadFriends = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const friendAddresses = await friendsContract.getFriends(address);
      const friendProfiles: FriendProfile[] = [];

      // Load profiles for each friend
      for (const friendAddress of friendAddresses) {
        const profile = await addressToFriendProfile(friendAddress);
        if (profile) {
          friendProfiles.push(profile);
        }
      }

      setFriends(friendProfiles);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  }, [address, addressToFriendProfile]);

  /**
   * Load friend requests
   */
  const loadFriendRequests = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const requests = await friendsContract.getPendingRequests(address);
      const requestData: FriendRequestData[] = [];

      // Convert contract requests to our format
      for (const request of requests) {
        const fromProfile = await addressToFriendProfile(request.from);
        const toProfile = await addressToFriendProfile(address);

        if (fromProfile && toProfile) {
          requestData.push({
            id: `${request.from}-${address}-${request.timestamp}`,
            from: fromProfile,
            to: toProfile,
            message: request.message,
            timestamp: new Date(Number(request.timestamp) * 1000),
            status: 'pending',
          });
        }
      }

      setFriendRequests(requestData);
    } catch (err) {
      console.error('Error loading friend requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load friend requests');
    } finally {
      setIsLoading(false);
    }
  }, [address, addressToFriendProfile]);

  /**
   * Send friend request
   */
  const sendFriendRequest = useCallback(async (friendAddress: string, message: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    if (friendAddress.toLowerCase() === address.toLowerCase()) {
      setError('Cannot send friend request to yourself');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if already friends
      const alreadyFriends = await friendsContract.areFriends(address, friendAddress);
      if (alreadyFriends) {
        setError('Already friends with this user');
        return false;
      }

      // Check if request already exists
      const requestExists = await friendsContract.friendRequestExists(address, friendAddress);
      if (requestExists) {
        setError('Friend request already sent');
        return false;
      }

      // Validate message length (contract limit is 200 chars)
      if (message.length > 200) {
        setError('Message too long (max 200 characters)');
        return false;
      }

      // Send request
      const txHash = await friendsContract.sendFriendRequest(friendAddress, message);
      console.log('Friend request sent:', txHash);

      // Wait for transaction confirmation, then refresh
      setTimeout(async () => {
        await loadFriendRequests();
      }, 3000);

      return true;
    } catch (err) {
      console.error('Error sending friend request:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('not registered')) {
          setError('Target user is not registered');
        } else if (err.message.includes('already sent')) {
          setError('Friend request already sent');
        } else if (err.message.includes('already friends')) {
          setError('Already friends with this user');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to send friend request');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadFriendRequests]);

  /**
   * Accept friend request
   */
  const acceptFriendRequest = useCallback(async (requesterAddress: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify request exists
      const requestExists = await friendsContract.friendRequestExists(requesterAddress, address);
      if (!requestExists) {
        setError('Friend request not found');
        return false;
      }

      const txHash = await friendsContract.acceptFriendRequest(requesterAddress);
      console.log('Friend request accepted:', txHash);

      // Remove request from local state immediately for better UX
      setFriendRequests(prev => prev.filter(req => req.from.address !== requesterAddress));

      // Wait for transaction confirmation, then refresh both friends and requests
      setTimeout(async () => {
        await Promise.all([loadFriends(), loadFriendRequests()]);
      }, 3000);

      return true;
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept friend request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadFriends, loadFriendRequests]);

  /**
   * Decline friend request
   */
  const declineFriendRequest = useCallback(async (requesterAddress: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify request exists
      const requestExists = await friendsContract.friendRequestExists(requesterAddress, address);
      if (!requestExists) {
        setError('Friend request not found');
        return false;
      }

      const txHash = await friendsContract.declineFriendRequest(requesterAddress);
      console.log('Friend request declined:', txHash);

      // Remove request from local state immediately
      setFriendRequests(prev => prev.filter(req => req.from.address !== requesterAddress));

      // Wait for transaction confirmation, then refresh requests
      setTimeout(async () => {
        await loadFriendRequests();
      }, 3000);

      return true;
    } catch (err) {
      console.error('Error declining friend request:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline friend request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadFriendRequests]);

  /**
   * Remove friend
   */
  const removeFriend = useCallback(async (friendAddress: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify friendship exists
      const areFriends = await friendsContract.areFriends(address, friendAddress);
      if (!areFriends) {
        setError('Not friends with this user');
        return false;
      }

      const txHash = await friendsContract.removeFriend(friendAddress);
      console.log('Friend removed:', txHash);

      // Remove friend from local state immediately
      setFriends(prev => prev.filter(friend => friend.address !== friendAddress));

      // Wait for transaction confirmation, then refresh
      setTimeout(async () => {
        await loadFriends();
      }, 3000);

      return true;
    } catch (err) {
      console.error('Error removing friend:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadFriends]);

  /**
   * Get friend count
   */
  const getFriendCount = useCallback(async (): Promise<number> => {
    if (!address) return 0;

    try {
      const count = await friendsContract.getFriendCount(address);
      return Number(count);
    } catch (err) {
      console.error('Error getting friend count:', err);
      return 0;
    }
  }, [address]);

  /**
   * Check if two users are friends
   */
  const checkFriendship = useCallback(async (friendAddress: string): Promise<boolean> => {
    if (!address) return false;

    try {
      return await friendsContract.areFriends(address, friendAddress);
    } catch (err) {
      console.error('Error checking friendship:', err);
      return false;
    }
  }, [address]);

  /**
   * Search friend by username
   */
  const searchFriendByUsername = useCallback(async (username: string): Promise<FriendProfile | null> => {
    try {
      const friendAddress = await getAddressByUsername(username);
      if (!friendAddress) return null;

      return await addressToFriendProfile(friendAddress);
    } catch (err) {
      console.error('Error searching friend by username:', err);
      return null;
    }
  }, [getAddressByUsername, addressToFriendProfile]);

  /**
   * Get friend suggestions (using contract function)
   */
  const getFriendSuggestions = useCallback(async (limit: number = 5): Promise<FriendProfile[]> => {
    if (!address) return [];

    try {
      const suggestionAddresses = await friendsContract.getFriendSuggestions(address, limit);
      const suggestions: FriendProfile[] = [];

      for (const suggestionAddress of suggestionAddresses) {
        const profile = await addressToFriendProfile(suggestionAddress);
        if (profile) {
          suggestions.push(profile);
        }
      }

      return suggestions;
    } catch (err) {
      console.error('Error getting friend suggestions:', err);
      return [];
    }
  }, [address, addressToFriendProfile]);

  /**
   * Refresh friends list
   */
  const refreshFriends = useCallback(async () => {
    await loadFriends();
  }, [loadFriends]);

  /**
   * Refresh friend requests
   */
  const refreshRequests = useCallback(async () => {
    await loadFriendRequests();
  }, [loadFriendRequests]);

  // Load data when address changes
  useEffect(() => {
    if (address) {
      Promise.all([loadFriends(), loadFriendRequests()]);
    } else {
      setFriends([]);
      setFriendRequests([]);
    }
  }, [address, loadFriends, loadFriendRequests]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!address) return;

    const unsubscribeRequests = eventWatcher.watchFriendRequests((logs) => {
      logs.forEach((log: any) => {
        if (log.args.to.toLowerCase() === address.toLowerCase()) {
          console.log('Friend request received');
          setTimeout(() => loadFriendRequests(), 1000);
        }
      });
    });

    const unsubscribeAccepted = eventWatcher.watchFriendRequestAccepted((logs) => {
      logs.forEach((log: any) => {
        if (log.args.from.toLowerCase() === address.toLowerCase() || 
            log.args.to.toLowerCase() === address.toLowerCase()) {
          console.log('Friend request accepted');
          setTimeout(async () => {
            await Promise.all([loadFriends(), loadFriendRequests()]);
          }, 1000);
        }
      });
    });

    const unsubscribeDeclined = eventWatcher.watchFriendRequestDeclined((logs) => {
      logs.forEach((log: any) => {
        if (log.args.from.toLowerCase() === address.toLowerCase() || 
            log.args.to.toLowerCase() === address.toLowerCase()) {
          console.log('Friend request declined');
          setTimeout(() => loadFriendRequests(), 1000);
        }
      });
    });

    const unsubscribeRemoved = eventWatcher.watchFriendshipRemoved((logs) => {
      logs.forEach((log: any) => {
        if (log.args.user1.toLowerCase() === address.toLowerCase() || 
            log.args.user2.toLowerCase() === address.toLowerCase()) {
          console.log('Friendship removed');
          setTimeout(() => loadFriends(), 1000);
        }
      });
    });

    return () => {
      unsubscribeRequests?.();
      unsubscribeAccepted?.();
      unsubscribeDeclined?.();
      unsubscribeRemoved?.();
    };
  }, [address, loadFriends, loadFriendRequests]);

  return {
    friends,
    friendRequests,
    isLoading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriendCount,
    checkFriendship,
    searchFriendByUsername,
    refreshFriends,
    refreshRequests,
    getFriendSuggestions,
  };
};