import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ensContract, friendsContract, groupsContract, chatTokenContract } from '../contracts/utils/contractCalls';

interface ContractTestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
}

interface UseContractTestReturn {
  testResults: ContractTestResult[];
  isLoading: boolean;
  runAllTests: () => Promise<void>;
  runEnsTests: () => Promise<void>;
  runTokenTests: () => Promise<void>;
  runFriendsTests: () => Promise<void>;
  runGroupsTests: () => Promise<void>;
  clearResults: () => void;
}

export const useContractTest = (): UseContractTestReturn => {
  const { address } = useAccount();
  const [testResults, setTestResults] = useState<ContractTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = useCallback((result: ContractTestResult) => {
    setTestResults(prev => [...prev, result]);
  }, []);

  const updateResult = useCallback((testName: string, update: Partial<ContractTestResult>) => {
    setTestResults(prev => prev.map(result => 
      result.test === testName ? { ...result, ...update } : result
    ));
  }, []);

  const runTest = useCallback(async (
    testName: string, 
    testFunction: () => Promise<any>
  ) => {
    addResult({ test: testName, status: 'pending' });
    
    try {
      const result = await testFunction();
      updateResult(testName, { status: 'success', result });
    } catch (error) {
      updateResult(testName, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [addResult, updateResult]);

  const runEnsTests = useCallback(async () => {
    if (!address) {
      addResult({ test: 'ENS Tests', status: 'error', error: 'Wallet not connected' });
      return;
    }

    await runTest('Check Registration Fee', async () => {
      const fee = await ensContract.getRegistrationFee();
      return `${fee} wei`;
    });

    await runTest('Check Total Users', async () => {
      const total = await ensContract.getTotalUsers();
      return `${total} users`;
    });

    await runTest('Check User Registration Status', async () => {
      const isRegistered = await ensContract.isRegistered(address);
      return isRegistered ? 'Registered' : 'Not registered';
    });

    await runTest('Get User Profile', async () => {
      const profile = await ensContract.getProfile(address);
      return profile.exists ? {
        username: profile.username,
        bio: profile.bio,
        hasAvatar: !!profile.avatarHash,
      } : 'No profile found';
    });

    await runTest('Check Username Availability', async () => {
      const testUsername = 'testuser' + Date.now();
      const isAvailable = await ensContract.isUsernameAvailable(testUsername);
      return isAvailable ? 'Available' : 'Not available';
    });
  }, [address, runTest, addResult]);

  const runTokenTests = useCallback(async () => {
    if (!address) {
      addResult({ test: 'Token Tests', status: 'error', error: 'Wallet not connected' });
      return;
    }

    await runTest('Get Token Balance', async () => {
      const balance = await chatTokenContract.getBalance(address);
      return `${balance} CHAT tokens`;
    });

    await runTest('Get Pending Rewards', async () => {
      const pending = await chatTokenContract.getPendingRewards(address);
      return `${pending} pending tokens`;
    });

    await runTest('Check Daily Claim Status', async () => {
      const canClaim = await chatTokenContract.canClaimDailyReward(address);
      return canClaim ? 'Can claim daily reward' : 'Already claimed today';
    });

    await runTest('Get Total Earned', async () => {
      const total = await chatTokenContract.getTotalEarned(address);
      return `${total} total earned`;
    });

    await runTest('Get Activity Reward - Daily Login', async () => {
      const reward = await chatTokenContract.getActivityReward('daily_login');
      return `${reward} tokens for daily login`;
    });

    await runTest('Get Reward Multiplier', async () => {
      const multiplier = await chatTokenContract.getRewardMultiplier(address);
      return `${multiplier}% multiplier`;
    });
  }, [address, runTest, addResult]);

  const runFriendsTests = useCallback(async () => {
    if (!address) {
      addResult({ test: 'Friends Tests', status: 'error', error: 'Wallet not connected' });
      return;
    }

    await runTest('Get Friends List', async () => {
      const friends = await friendsContract.getFriends(address);
      return `${friends.length} friends`;
    });

    await runTest('Get Friend Count', async () => {
      const count = await friendsContract.getFriendCount(address);
      return `${count} friends`;
    });

    await runTest('Get Pending Requests', async () => {
      const requests = await friendsContract.getPendingRequests(address);
      return `${requests.length} pending requests`;
    });

    await runTest('Get Friend Suggestions', async () => {
      const suggestions = await friendsContract.getFriendSuggestions(address, 5);
      return `${suggestions.length} suggestions`;
    });
  }, [address, runTest, addResult]);

  const runGroupsTests = useCallback(async () => {
    if (!address) {
      addResult({ test: 'Groups Tests', status: 'error', error: 'Wallet not connected' });
      return;
    }

    await runTest('Get User Groups', async () => {
      const groups = await groupsContract.getUserGroups(address);
      return `${groups.length} groups`;
    });

    await runTest('Get Total Groups', async () => {
      const total = await groupsContract.getTotalGroups();
      return `${total} total groups`;
    });

    await runTest('Get Public Groups', async () => {
      const publicGroups = await groupsContract.getPublicGroups(0, 10);
      return `${publicGroups.length} public groups`;
    });

    await runTest('Search Groups', async () => {
      const searchResults = await groupsContract.searchGroups('test', 5);
      return `${searchResults.length} search results for 'test'`;
    });
  }, [address, runTest, addResult]);

  const runAllTests = useCallback(async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      await runEnsTests();
      await runTokenTests();
      await runFriendsTests();
      await runGroupsTests();
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [runEnsTests, runTokenTests, runFriendsTests, runGroupsTests]);

  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);

  return {
    testResults,
    isLoading,
    runAllTests,
    runEnsTests,
    runTokenTests,
    runFriendsTests,
    runGroupsTests,
    clearResults,
  };
};