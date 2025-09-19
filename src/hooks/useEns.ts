import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ensContract, eventWatcher } from '../contracts/utils/contractCalls';
import { APP_CONFIG, CONTRACT_CONSTANTS } from '../libs/constants';
import { pinataService } from '../libs/ipfs/pinata';
import { formatEther } from 'viem';

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
  getRegistrationFee: () => Promise<string>;
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
      // Check if user is registered first
      const isRegistered = await ensContract.isRegistered(targetAddress);
      
      if (!isRegistered) {
        setProfile({
          username: '',
          bio: '',
          avatarHash: '',
          avatarUrl: '',
          ensName: '',
          registrationTime: new Date(),
          isRegistered: false,
        });
        return;
      }

      // Get complete profile
      const contractProfile = await ensContract.getProfile(targetAddress);
      
      if (contractProfile.exists && contractProfile.username) {
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
        // Registered but no profile data (shouldn't happen normally)
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
      setError(err instanceof Error ? err.message : 'Failed to load profile');
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
      
      // Validate username format client-side first
      if (username.length < CONTRACT_CONSTANTS.ENS.MIN_USERNAME_LENGTH || 
          username.length > CONTRACT_CONSTANTS.ENS.MAX_USERNAME_LENGTH) {
        throw new Error(`Username must be between ${CONTRACT_CONSTANTS.ENS.MIN_USERNAME_LENGTH} and ${CONTRACT_CONSTANTS.ENS.MAX_USERNAME_LENGTH} characters`);
      }

      // Check against contract
      return await ensContract.isUsernameAvailable(username);
    } catch (err) {
      console.error('Error checking username availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to check username availability');
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

      // Check if user is already registered
      const alreadyRegistered = await ensContract.isRegistered(address);
      if (alreadyRegistered) {
        setError('User already has a registered username');
        return false;
      }

      // Register username (contract handles fee)
      const txHash = await ensContract.registerUsername(username);
      console.log('Registration transaction:', txHash);

      // Wait a bit for transaction to be mined, then reload profile
      await new Promise(resolve => setTimeout(resolve, 5000));
      await loadProfile();

      return true;
    } catch (err) {
      console.error('Error registering username:', err);
      
      // Parse contract errors
      if (err instanceof Error) {
        if (err.message.includes('insufficient')) {
          setError('Insufficient balance for registration fee');
        } else if (err.message.includes('already taken')) {
          setError('Username is already taken');
        } else if (err.message.includes('invalid')) {
          setError('Invalid username format');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to register username');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, checkUsernameAvailability, loadProfile]);

  /**
   * Update profile information (bio and/or avatar)
   */
  const updateProfile = useCallback(async (updates: Partial<Pick<EnsProfile, 'bio' | 'avatarHash'>>): Promise<boolean> => {
    if (!address || !profile?.isRegistered) {
      setError('Profile not registered');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If both bio and avatar are being updated, use the combined function
      if (updates.bio !== undefined && updates.avatarHash !== undefined) {
        await ensContract.updateProfile(updates.bio, updates.avatarHash);
      } else if (updates.bio !== undefined) {
        // Validate bio length
        if (updates.bio.length > CONTRACT_CONSTANTS.ENS.MAX_BIO_LENGTH) {
          throw new Error(`Bio must be less than ${CONTRACT_CONSTANTS.ENS.MAX_BIO_LENGTH} characters`);
        }
        await ensContract.updateBio(updates.bio);
      } else if (updates.avatarHash !== undefined) {
        if (!updates.avatarHash) {
          throw new Error('Avatar hash cannot be empty');
        }
        await ensContract.updateAvatar(updates.avatarHash);
      }

      // Update local state immediately for better UX
      setProfile(prev => prev ? {
        ...prev,
        ...updates,
        avatarUrl: updates.avatarHash 
          ? pinataService.getGatewayUrl(updates.avatarHash)
          : prev.avatarUrl
      } : null);

      // Reload from contract to ensure consistency
      setTimeout(() => loadProfile(), 2000);

      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err instanceof Error) {
        if (err.message.includes('too long')) {
          setError('Bio is too long');
        } else if (err.message.includes('invalid')) {
          setError('Invalid avatar hash');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to update profile');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, profile, loadProfile]);

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
          uploadedBy: address,
        }
      });

      // Update contract
      const success = await updateProfile({ avatarHash });
      return success;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
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
      const isRegistered = await ensContract.isRegistered(userAddress);
      if (!isRegistered) return null;

      const contractProfile = await ensContract.getProfile(userAddress);
      
      if (!contractProfile.exists || !contractProfile.username) return null;

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

  /**
   * Get registration fee in ETH
   */
  const getRegistrationFee = useCallback(async (): Promise<string> => {
    try {
      const fee = await ensContract.getRegistrationFee();
      return formatEther(fee);
    } catch (err) {
      console.error('Error getting registration fee:', err);
      return CONTRACT_CONSTANTS.ENS.REGISTRATION_FEE; // Fallback to constant
    }
  }, []);

  // Load profile when address changes
  useEffect(() => {
    if (address) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [address, loadProfile]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!address) return;

    const unsubscribeRegistration = eventWatcher.watchUsernameRegistrations((logs) => {
      logs.forEach((log: any) => {
        if (log.args.owner.toLowerCase() === address.toLowerCase()) {
          console.log('Username registered event received');
          setTimeout(() => loadProfile(), 1000); // Small delay for blockchain confirmation
        }
      });
    });

    const unsubscribeProfile = eventWatcher.watchProfileUpdates((logs) => {
      logs.forEach((log: any) => {
        if (log.args.user.toLowerCase() === address.toLowerCase()) {
          console.log('Profile updated event received');
          setTimeout(() => loadProfile(), 1000);
        }
      });
    });

    const unsubscribeAvatar = eventWatcher.watchAvatarUpdates((logs) => {
      logs.forEach((log: any) => {
        if (log.args.user.toLowerCase() === address.toLowerCase()) {
          console.log('Avatar updated event received');
          setTimeout(() => loadProfile(), 1000);
        }
      });
    });

    return () => {
      unsubscribeRegistration?.();
      unsubscribeProfile?.();
      unsubscribeAvatar?.();
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
    getRegistrationFee,
  };
};