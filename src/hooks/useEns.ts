import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ensContract, eventWatcher } from '../contracts/utils/contractCalls';
import { APP_CONFIG } from '../libs/constants';
import pinataService from '../libs/ipfs/pinata';

interface EnsProfile {
  username: string;
  bio: string;
  avatarHash: string;
  avatarUrl: string;
  ensName: string;
  registrationTime: Date;
  isRegistered: boolean;
}

interface UseEnsReturn {
  profile: EnsProfile | null;
  isLoading: boolean;
  error: string | null;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  registerUsername: (username: string) => Promise<boolean>;
  updateProfile: (updates: Partial<Pick<EnsProfile, 'bio' | 'avatarHash'>>) => Promise<boolean>;
  uploadAndSetAvatar: (file: File) => Promise<boolean>;
  getProfileByAddress: (address: string) => Promise<EnsProfile | null>;
  getAddressByUsername: (username: string) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

export const useEns = (): UseEnsReturn => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [profile, setProfile] = useState<EnsProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user profile from ENS contract
   */
  const loadProfile = useCallback(async (userAddress?: string) => {
    if (!userAddress && !address) return;
    
    const targetAddress = userAddress || address!;
    setIsLoading(true);
    setError(null);

    try {
      const contractProfile = await ensContract.getProfile(targetAddress);
      
      if (contractProfile.username) {
        const avatarUrl = contractProfile.avatarHash 
          ? pinataService.getGatewayUrl(contractProfile.avatarHash)
          : `${APP_CONFIG.DICEBEAR_API}?seed=${contractProfile.username}`;

        const profile: EnsProfile = {
          username: contractProfile.username,
          bio: contractProfile.bio || '',
          avatarHash: contractProfile.avatarHash || '',
          avatarUrl,
          ensName: `${contractProfile.username}${APP_CONFIG.ENS_SUFFIX}`,
          registrationTime: new Date(Number(contractProfile.registrationTime) * 1000),
          isRegistered: true,
        };

        setProfile(profile);
      } else {
        setProfile({
          username: '',
          bio: '',
          avatarHash: '',
          avatarUrl: '',
          ensName: '',
          registrationTime: new Date(),
          isRegistered: false,
        });
      }
    } catch (err) {
      console.error('Error loading ENS profile:', err);
      setError('Failed to load profile');
      setProfile({
        username: '',
        bio: '',
        avatarHash: '',
        avatarUrl: '',
        ensName: '',
        registrationTime: new Date(),
        isRegistered: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  /**
   * Check if username is available
   */
  const checkUsernameAvailability = useCallback(async (username: string): Promise<boolean> => {
    try {
      setError(null);
      return await ensContract.isUsernameAvailable(username);
    } catch (err) {
      console.error('Error checking username availability:', err);
      setError('Failed to check username availability');
      return false;
    }
  }, []);

  /**
   * Register a new username
   */
  const registerUsername = useCallback(async (username: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check availability first
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setError('Username is already taken');
        return false;
      }

      // Register username
      const txHash = await ensContract.registerUsername(username);
      console.log('Registration transaction:', txHash);

      // Wait for transaction and reload profile
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simple wait
      await loadProfile();

      return true;
    } catch (err) {
      console.error('Error registering username:', err);
      setError('Failed to register username');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, checkUsernameAvailability, loadProfile]);

  /**
   * Update profile information
   */
  const updateProfile = useCallback(async (updates: Partial<Pick<EnsProfile, 'bio' | 'avatarHash'>>): Promise<boolean> => {
    if (!address || !profile?.isRegistered) {
      setError('Profile not registered');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const promises: Promise<any>[] = [];

      if (updates.bio !== undefined) {
        promises.push(ensContract.updateBio(updates.bio));
      }

      if (updates.avatarHash !== undefined) {
        promises.push(ensContract.updateAvatar(updates.avatarHash));
      }

      await Promise.all(promises);

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        ...updates,
        avatarUrl: updates.avatarHash 
          ? pinataService.getGatewayUrl(updates.avatarHash)
          : prev.avatarUrl
      } : null);

      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, profile]);

  /**
   * Upload avatar to IPFS and update profile
   */
  const uploadAndSetAvatar = useCallback(async (file: File): Promise<boolean> => {
    if (!address || !profile?.isRegistered) {
      setError('Profile not registered');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate file
      const validation = pinataService.validateFile(file, 5); // 5MB limit for avatars
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return false;
      }

      // Compress if it's an image
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await pinataService.compressImage(file, 1); // 1MB max
      }

      // Upload to IPFS
      const avatarHash = await pinataService.uploadFile(fileToUpload, {
        name: `${profile.username}-avatar`,
        keyvalues: {
          type: 'avatar',
          username: profile.username,
        }
      });

      // Update contract
      const success = await updateProfile({ avatarHash });
      return success;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, profile, updateProfile]);

  /**
   * Get profile by address
   */
  const getProfileByAddress = useCallback(async (userAddress: string): Promise<EnsProfile | null> => {
    try {
      const contractProfile = await ensContract.getProfile(userAddress);
      
      if (!contractProfile.username) return null;

      const avatarUrl = contractProfile.avatarHash 
        ? pinataService.getGatewayUrl(contractProfile.avatarHash)
        : `${APP_CONFIG.DICEBEAR_API}?seed=${contractProfile.username}`;

      return {
        username: contractProfile.username,
        bio: contractProfile.bio || '',
        avatarHash: contractProfile.avatarHash || '',
        avatarUrl,
        ensName: `${contractProfile.username}${APP_CONFIG.ENS_SUFFIX}`,
        registrationTime: new Date(Number(contractProfile.registrationTime) * 1000),
        isRegistered: true,
      };
    } catch (err) {
      console.error('Error getting profile by address:', err);
      return null;
    }
  }, []);

  /**
   * Get address by username
   */
  const getAddressByUsername = useCallback(async (username: string): Promise<string | null> => {
    try {
      const address = await ensContract.getAddressByUsername(username);
      return address === '0x0000000000000000000000000000000000000000' ? null : address;
    } catch (err) {
      console.error('Error getting address by username:', err);
      return null;
    }
  }, []);

  /**
   * Refresh current profile
   */
  const refreshProfile = useCallback(async () => {
    if (address) {
      await loadProfile();
    }
  }, [address, loadProfile]);

  // Load profile when address changes
  useEffect(() => {
    if (address) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [address, loadProfile]);

  // Set up event listeners
  useEffect(() => {
    if (!address) return;

    const unsubscribeRegistration = eventWatcher.watchUsernameRegistrations((logs) => {
      logs.forEach((log: any) => {
        if (log.args.owner.toLowerCase() === address.toLowerCase()) {
          loadProfile();
        }
      });
    });

    const unsubscribeProfile = eventWatcher.watchProfileUpdates((logs) => {
      logs.forEach((log: any) => {
        if (log.args.user.toLowerCase() === address.toLowerCase()) {
          loadProfile();
        }
      });
    });

    return () => {
      unsubscribeRegistration?.();
      unsubscribeProfile?.();
    };
  }, [address, loadProfile]);

  return {
    profile,
    isLoading,
    error,
    checkUsernameAvailability,
    registerUsername,
    updateProfile,
    uploadAndSetAvatar,
    getProfileByAddress,
    getAddressByUsername,
    refreshProfile,
  };
};